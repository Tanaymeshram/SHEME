from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# In-memory mock users mapping for API fallback
MOCK_USERS = {
    "admin": {"username": "admin", "password": "admin123", "role": "Admin", "name": "Dr. Sarah Jenkins"},
    "manager": {"username": "manager", "password": "manager123", "role": "Energy Manager", "name": "Mark Vance"},
    "tech": {"username": "tech", "password": "tech123", "role": "Technician", "name": "Alex Rivera"}
}

@router.post("/login")
async def login(
    payload: Dict[str, str] = Body(...)
):
    """
    Log in BEMS operator user.
    """
    username = payload.get("username")
    password = payload.get("password")
    
    if username in MOCK_USERS and MOCK_USERS[username]["password"] == password:
        user_info = MOCK_USERS[username].copy()
        user_info.pop("password")  # Remove sensitive field
        return {"success": True, "user": user_info}
        
    raise HTTPException(status_code=401, detail="Access Denied. Check credentials.")

@router.post("/register")
async def register(
    payload: Dict[str, str] = Body(...)
):
    """
    Register new operator profiles.
    """
    username = payload.get("username")
    password = payload.get("password")
    name = payload.get("name")
    role = payload.get("role")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required.")
        
    if username in MOCK_USERS:
        raise HTTPException(status_code=400, detail="Username already exists.")
        
    MOCK_USERS[username] = {
        "username": username,
        "password": password,
        "role": role or "Technician",
        "name": name or username
    }
    return {"success": True, "message": "Account registered successfully."}
