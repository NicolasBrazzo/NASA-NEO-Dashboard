from fastapi import APIRouter

router = APIRouter()

@router.get("/feed")
async def get_feed(start_date: str, end_date: str, hazardous: bool = None, sort_by: str = "distance"):
    return {"message": "feed ok"}

@router.get("/stats")
async def get_stats(start_date: str, end_date: str):
    return {"message": "stats ok"}

@router.get("/{neo_id}")
async def get_neo(neo_id: str):
    return {"message": f"neo {neo_id} ok"}