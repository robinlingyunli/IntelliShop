import json
import os
from typing import Literal

from anthropic import AsyncAnthropic
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import User
from routers import cart as cart_router
from routers import products as products_router
from schemas import CartItemCreate, CartItemOut, ProductOut

load_dotenv()

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")

router = APIRouter(prefix="/ai", tags=["ai"])

SYSTEM_PROMPT = """You are a helpful shopping assistant for IntelliShop, an online retail shop.

Rules:
- ALWAYS use the search_products tool before recommending any product. Never recommend a product from memory.
- Only mention products that were actually returned by a tool call. If a search returns nothing, say so honestly.
- Use the update_cart tool when the user asks to add something to their cart. Never claim you added something without actually calling the tool.
- Use effective_price (which already accounts for any discount) when discussing price, not the original price.
- Keep responses concise and friendly.
- Respond in the same language the user uses."""

TOOLS = [
    {
        "name": "search_products",
        "description": "Search the shop's products by keyword. Returns matching products with name, price, discount, effective price, and stock.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search keyword to match against product names, e.g. 'toy', 'bowl'",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_cart",
        "description": "Get the current user's shopping cart contents.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "update_cart",
        "description": "Add a product to the current user's cart, or increase its quantity if it's already in the cart.",
        "input_schema": {
            "type": "object",
            "properties": {
                "product_id": {
                    "type": "integer",
                    "description": "The ID of the product to add, from a previous search_products result",
                },
                "quantity": {
                    "type": "integer",
                    "description": "How many units to add",
                    "default": 1,
                },
            },
            "required": ["product_id"],
        },
    },
]


def _product_to_dict(product) -> dict:
    data = ProductOut.model_validate(product).model_dump(mode="json")
    price = float(data["price"])
    discount = data["discount_percentage"]
    data["effective_price"] = round(price * (1 - discount / 100), 2) if discount else price
    return data


def _cart_item_to_dict(cart_item) -> dict:
    data = CartItemOut.model_validate(cart_item).model_dump(mode="json")
    data["product"] = _product_to_dict(cart_item.product)
    return data


async def execute_tool(
    name: str, arguments: dict, current_user: User, db: AsyncSession
) -> dict | list:
    try:
        if name == "search_products":
            results = await products_router.list_products(q=arguments.get("query"), db=db)
            return [_product_to_dict(p) for p in results]

        if name == "get_cart":
            results = await cart_router.get_cart(current_user=current_user, db=db)
            return [_cart_item_to_dict(c) for c in results]

        if name == "update_cart":
            item_in = CartItemCreate(
                product_id=arguments["product_id"],
                quantity=arguments.get("quantity", 1),
            )
            cart_item = await cart_router.add_to_cart(
                item_in=item_in, current_user=current_user, db=db
            )
            return _cart_item_to_dict(cart_item)

        return {"error": f"Unknown tool: {name}"}
    except HTTPException as exc:
        return {"error": exc.detail}


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


def _sse(event: str, **data) -> bytes:
    return f"data: {json.dumps({'event': event, **data})}\n\n".encode("utf-8")


@router.post("/chat")
async def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    async def event_stream():
        messages = [{"role": m.role, "content": m.content} for m in payload.messages]
        last_products: list[dict] = []

        while True:
            async with client.messages.stream(
                model=MODEL,
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=messages,
            ) as stream:
                async for event in stream:
                    if event.type == "text":
                        yield _sse("token", text=event.text)
                response = await stream.get_final_message()

            if response.stop_reason != "tool_use":
                yield _sse("done", products=last_products)
                return

            messages.append({"role": "assistant", "content": response.content})

            tool_result_blocks = []
            for block in response.content:
                if block.type != "tool_use":
                    continue
                yield _sse("tool_call", tool=block.name)
                result = await execute_tool(block.name, block.input, current_user, db)
                if block.name == "search_products" and isinstance(result, list):
                    last_products = result
                yield _sse("tool_result", tool=block.name)
                tool_result_blocks.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result),
                    }
                )

            messages.append({"role": "user", "content": tool_result_blocks})

    return StreamingResponse(event_stream(), media_type="text/event-stream")
