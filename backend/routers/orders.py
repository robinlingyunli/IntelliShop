from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import get_current_user
from database import get_db
from models import CartItem, Order, OrderItem, User
from schemas import OrderOut

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

    total_amount = sum(item.product.price * item.quantity for item in cart_items)

    order = Order(user_id=current_user.id, status="pending", total_amount=total_amount)
    db.add(order)
    await db.flush()  # write the order now (not yet committed) so order.id becomes available

    for item in cart_items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.product.price,
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
