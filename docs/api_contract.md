# API Contract

## 1) Create complaint
**POST** `/api/complaints`

### Body (JSON)
{
  "citizen_id": "user-123",
  "description": "Pothole near market",
  "category": "auto-detect",
  "location": {
    "lat": 28.7041,
    "lng": 77.1025,
    "address": "Near Sector X"
  },
  "media": [
    { "type":"image", "url":"<temporary or base64 or upload-key>" }
  ]
}

### Response
{
  "complaint_id": "compl-0001",
  "status":"unresolved",
  "created_at":"..."
}

---

## 2) List complaints
**GET** `/api/complaints?status=unresolved&near=28.7,77.1&radius_km=5`

### Response
[
  {
    "complaint_id":"compl-0001",
    "brief":"Pothole near market",
    "location":{...},
    "upvotes":3
  }
]

---

## 3) Get complaint by id
**GET** `/api/complaints/:id`  
→ returns full complaint object with media and status updates.

---

## 4) Update complaint status (staff)
**PUT** `/api/complaints/:id/status`

### Body
{
  "status":"in-progress",
  "comment":"Inspection done",
  "expected_resolution_date":"2025-09-20"
}

---

## 5) Refile
**POST** `/api/complaints/:id/refile`

### Body
{
  "citizen_id":"user-123",
  "new_description":"Still not fixed",
  "media":[ { "type":"image", "url":"..." } ]
}

---

## 6) Upvote
**POST** `/api/complaints/:id/upvote`

### Body
{
  "user_id":"user-123"
}
