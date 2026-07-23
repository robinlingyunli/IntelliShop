from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import get_current_user
from database import get_db
from models import CartItem, Product, User
from schemas import CartItemCreate, CartItemOut, CartItemUpdate

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=list[CartItemOut])
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == current_user.id)
        .options(selectinload(CartItem.product))
    )
    return result.scalars().all()


@router.post("", response_model=CartItemOut, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    item_in: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    product = await db.get(Product, item_in.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    result = await db.execute(
        select(CartItem).where(
            CartItem.user_id == current_user.id,
            CartItem.product_id == item_in.product_id,
        )
    )
    cart_item = result.scalar_one_or_none()
    if cart_item:
        cart_item.quantity += item_in.quantity
    else:
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity,
        )
        db.add(cart_item)

    await db.commit()
    await db.refresh(cart_item, attribute_names=["product"])
    return cart_item


@router.put("/{item_id}", response_model=CartItemOut)
async def update_cart_item(
    item_id: int,
    item_in: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cart_item = await db.get(CartItem, item_id)
    if not cart_item or cart_item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Cart item not found")

    cart_item.quantity = item_in.quantity
    await db.commit()
    await db.refresh(cart_item, attribute_names=["product"])
    return cart_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cart_item = await db.get(CartItem, item_id)
    if not cart_item or cart_item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Cart item not found")

    await db.delete(cart_item)
    await db.commit()
