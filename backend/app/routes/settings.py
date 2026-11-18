from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import WeightSetting
from app.schemas import WeightSettingsSchema

router = APIRouter(prefix="/settings", tags=["Settings"])

def get_or_create_weights(db: Session) -> WeightSetting:
    setting = db.query(WeightSetting).first()
    if not setting:
        setting = WeightSetting(
            semantic_weight=35.0,
            skill_weight=30.0,
            experience_weight=15.0,
            education_weight=10.0,
            project_weight=10.0
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@router.get("/weights", response_model=WeightSettingsSchema)
def get_weights(db: Session = Depends(get_db)):
    setting = get_or_create_weights(db)
    return WeightSettingsSchema(
        semantic_weight=setting.semantic_weight,
        skill_weight=setting.skill_weight,
        experience_weight=setting.experience_weight,
        education_weight=setting.education_weight,
        project_weight=setting.project_weight
    )

@router.put("/weights", response_model=WeightSettingsSchema)
def update_weights(payload: WeightSettingsSchema, db: Session = Depends(get_db)):
    total = (
        payload.semantic_weight +
        payload.skill_weight +
        payload.experience_weight +
        payload.education_weight +
        payload.project_weight
    )
    if abs(total - 100.0) > 0.5:
        raise HTTPException(
            status_code=400,
            detail=f"The sum of all weights must equal 100%. Currently it is {total:.1f}%."
        )

    setting = get_or_create_weights(db)
    setting.semantic_weight = payload.semantic_weight
    setting.skill_weight = payload.skill_weight
    setting.experience_weight = payload.experience_weight
    setting.education_weight = payload.education_weight
    setting.project_weight = payload.project_weight
    setting.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(setting)

    return WeightSettingsSchema(
        semantic_weight=setting.semantic_weight,
        skill_weight=setting.skill_weight,
        experience_weight=setting.experience_weight,
        education_weight=setting.education_weight,
        project_weight=setting.project_weight
    )

