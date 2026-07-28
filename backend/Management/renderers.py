from rest_framework.renderers import JSONRenderer


class CustomJSONRenderer(JSONRenderer):
    """Custom JSON renderer that wraps responses in a standard envelope."""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get("response") if renderer_context else None
        status_code = response.status_code if response else 200

        if status_code >= 400:
            # Error responses
            wrapped = {
                "status": "error",
                "message": self._extract_error_message(data),
                "errors": data if isinstance(data, dict) else None,
            }
        else:
            wrapped = {
                "status": "success",
                "data": data,
            }

        return super().render(wrapped, accepted_media_type, renderer_context)

    
    def _extract_error_message(self, data):
        if isinstance(data, dict):
            for key in ("detail", "message", "error"):
                if key in data:
                    return str(data[key])

            first_value = next(iter(data.values()), "An error occurred")
            if isinstance(first_value, list):
                return first_value[0]
            return str(first_value)

        if isinstance(data, list) and data:
            return str(data[0])

        return str(data) if data else "An error occurred"