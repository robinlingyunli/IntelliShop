from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import get_current_user
from database import get_db
from models import Product, Promotion, PromotionItem, User
from schemas import PromotionCreate, PromotionOut, PromotionUpdate

router = APIRouter(prefix="/promotions", tags=["promotions"])


async def _load_promotion(db: AsyncSession, promotion_id: int) -> Promotion | None:
    result = await db.execute(
        select(Promotion)
        .where(Promotion.id == promotion_id)
        .options(selectinload(Promotion.items).selectinload(PromotionItem.product))
        .execution_options(populate_existing=True)
    )
    return result.scalar_one_or_none()


async def _validate_owned_products(
    db: AsyncSession, product_ids: set[int], current_user: User
) -> dict[int, Product]:
    result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
    products = {p.id: p for p in result.scalars().all()}

    for product_id in product_ids:
        product = products.get(product_id)
        if not product or product.owner_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="You can only add your own products to a promotion"
            )

    return products


@router.get("", response_model=list[PromotionOut])
async def list_promotions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers have promotions")

    result = await db.execute(
        select(Promotion)
        .where(Promotion.seller_id == current_user.id)
        .options(selectinload(Promotion.items).selectinload(PromotionItem.product))
        .order_by(Promotion.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=PromotionOut, status_code=status.HTTP_201_CREATED)
async def create_promotion(
    payload: PromotionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can create promotions")
    if not payload.items:
        raise HTTPException(status_code=400, detail="Select at least one product")

    product_ids = {item.product_id for item in payload.items}
    products = await _validate_owned_products(db, product_ids, current_user)

    existing = await db.execute(
        select(PromotionItem.product_id).where(PromotionItem.product_id.in_(product_ids))
    )
    if set(existing.scalars().all()):
        raise HTTPException(
            status_code=400, detail="Some products are already part of another promotion"
        )

    promotion = Promotion(
        seller_id=current_user.id,
        title=payload.title,
        image_path=payload.image_path,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(promotion)
    await db.flush()

    for item in payload.items:
        db.add(
            PromotionItem(
                promotion_id=promotion.id,
                product_id=item.product_id,
                discount_percentage=item.discount_percentage,
            )
        )
        products[item.product_id].discount_percentage = item.discount_percentage

    await db.commit()
    return await _load_promotion(db, promotion.id)


@router.put("/{promotion_id}", response_model=PromotionOut)
async def update_promotion(
    promotion_id: int,
    payload: PromotionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can update promotions")

    promotion = await _load_promotion(db, promotion_id)
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")
    if promotion.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own promotions")

    scalar_updates = payload.model_dump(exclude_unset=True, exclude={"items"})
    for field, value in scalar_updates.items():
        setattr(promotion, field, value)

    if payload.items is not None:
        if not payload.items:
            raise HTTPException(status_code=400, detail="Select at least one product")

        old_product_ids = {item.product_id for item in promotion.items}
        new_product_ids = {item.product_id for item in payload.items}
        products = await _validate_owned_products(db, new_product_ids, current_user)

        newly_added_ids = new_product_ids - old_product_ids
        if newly_added_ids:
            existing = await db.execute(
                select(PromotionItem.product_id).where(
                    PromotionItem.product_id.in_(newly_added_ids),
                    PromotionItem.promotion_id != promotion_id,
                )
            )
            if set(existing.scalars().all()):
                raise HTTPException(
                    status_code=400,
                    detail="Some products are already part of another promotion",
                )

        removed_product_ids = old_product_ids - new_product_ids
        if removed_product_ids:
            removed_result = await db.execute(
                select(Product).where(Product.id.in_(removed_product_ids))
            )
            for product in removed_result.scalars().all():
                product.discount_percentage = None

        for item in list(promotion.items):
            await db.delete(item)
        await db.flush()

        for item in payload.items:
            db.add(
                PromotionItem(
                    promotion_id=promotion.id,
                    product_id=item.product_id,
                    discount_percentage=item.discount_percentage,
                )
            )
            products[item.product_id].discount_percentage = item.discount_percentage

    await db.commit()
    return await _load_promotion(db, promotion.id)


@router.delete("/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_promotion(
    promotion_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can delete promotions")

    promotion = await _load_promotion(db, promotion_id)
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")
    if promotion.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own promotions")

    product_ids = [item.product_id for item in promotion.items]
    if product_ids:
        product_result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
        for product in product_result.scalars().all():
            product.discount_percentage = None

    await db.delete(promotion)
    await db.commit()
