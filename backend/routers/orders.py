from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import get_current_user
from database import get_db
from models import CartItem, Order, OrderItem, Product, User
from schemas import OrderOut, OrderStatusUpdate, SellerOrderItemOut

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def checkout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == current_user.id)
        .options(selectinload(CartItem.product))
    )
    cart_items = result.scalars().all()

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    for item in cart_items:
        if item.product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough stock for {item.product.name}",
            )

    def effective_price(product):
        if product.discount_percentage is not None:
            return (product.price * (100 - product.discount_percentage) / 100).quantize(
                Decimal("0.01")
            )
        return product.price

    total_amount = sum(
        effective_price(item.product) * item.quantity for item in cart_items
    )

    order = Order(user_id=current_user.id, status="pending", total_amount=total_amount)
    db.add(order)
    await db.flush()  # write the order now (not yet committed) so order.id becomes available

    for item in cart_items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=effective_price(item.product),
            )
        )
        item.product.stock -= item.quantity
        await db.delete(item)

    await db.commit()

    result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    return result.scalar_one()


@router.get("", response_model=list[OrderOut])
async def list_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


@router.get("/seller", response_model=list[SellerOrderItemOut])
async def list_seller_order_items(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers have orders to manage")

    result = await db.execute(
        select(OrderItem)
        .join(Product, OrderItem.product_id == Product.id)
        .where(Product.owner_id == current_user.id)
        .options(
            selectinload(OrderItem.product),
            selectinload(OrderItem.order).selectinload(Order.user),
        )
        .order_by(OrderItem.id.desc())
    )
    order_items = result.scalars().all()

    return [
        {
            "id": item.id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "product": item.product,
            "order_id": item.order_id,
            "order_status": item.order.status,
            "order_created_at": item.order.created_at,
            "buyer_username": item.order.user.username,
        }
        for item in order_items
    ]


@router.put("/seller/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can update order status")

    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    owns_item = any(item.product.owner_id == current_user.id for item in order.items)
    if not owns_item:
        raise HTTPException(status_code=403, detail="You can only update orders containing your products")

    order.status = payload.status
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.user_id == current_user.id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
