---
type: fixed
---
{"slug": "nano-banana-2", "name": "Nano Banana 2", "category": "image", "modality": "image", "status": "active",
 "description": "Google's next-generation AI image model.",
 "inputs_schema": {"type": "object", "required": ["prompt"], "properties": {
   "prompt": {"type": "string", "description": "Text prompt"},
   "aspect_ratio": {"type": "string", "default": "1:1", "enum": ["1:1", "16:9", "9:16"]},
   "resolution": {"type": "string", "default": "1K", "enum": ["1K", "2K", "4K"]}}},
 "default_cost_usd": 0.09, "default_cost_unit": "image", "eta_seconds": 16.8,
 "run_path": "/api/v1/image/nano-banana-2/"}
