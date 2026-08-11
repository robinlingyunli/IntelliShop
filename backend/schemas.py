from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    username: str
    password: str
    role: Literal["user", "seller"] = "user"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProductCreate(BaseModel):
    name: str
    category: str
    price: Decimal
    stock: int = 0
    description: str | None = None
    image_path: str | None = None
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    price: Decimal | None = None
    stock: int | None = None
    description: str | None = None
    image_path: str | None = None
    is_active: bool | None = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int | None
    name: str
    category: str
    price: Decimal
    discount_percentage: int | None
    stock: int
    description: str | None
    image_path: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    product: ProductOut


class WishlistItemCreate(BaseModel):
    product_id: int


class WishlistItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    created_at: datetime
    product: ProductOut


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: ProductOut


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemOut]


class OrderStatusUpdate(BaseModel):
    status: Literal["pending", "paid", "shipped", "delivered", "cancelled"]


class SellerOrderItemOut(BaseModel):
    id: int
    quantity: int
    unit_price: Decimal
    product: ProductOut
    order_id: int
    order_status: str
    order_created_at: datetime
    buyer_username: str


class PromotionItemInput(BaseModel):
    product_id: int
    discount_percentage: int = Field(ge=5, le=95, multiple_of=5)


class PromotionCreate(BaseModel):
    title: str
    image_path: str | None = None
    start_date: datetime
    end_date: datetime
    items: list[PromotionItemInput]


class PromotionUpdate(BaseModel):
    title: str | None = None
    image_path: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    items: list[PromotionItemInput] | None = None


class PromotionItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    discount_percentage: int
    product: ProductOut


class PromotionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    image_path: str | None
    start_date: datetime
    end_date: datetime
    created_at: datetime
    updated_at: datetime
    items: list[PromotionItemOut]
