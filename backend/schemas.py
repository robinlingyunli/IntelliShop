from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
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
    name: str
    category: str
    price: Decimal
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
