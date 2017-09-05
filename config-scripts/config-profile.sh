## set profile properties
## 	https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/
## 	https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/get-started-button
curl -X POST -H "Content-Type: application/json" -d @app-config.json "https://graph.facebook.com/v2.6/me/messenger_profile?access_token=EAAIEcEbBR0QBAISsLDXDHyBGo1otUaBlvhWx0z2y9zSyjKG7lZBnTjrRJeEw888B39hWWaxldZCByfFW1M8tdi8ImOSUyf3naaW1GmVyGqaNG3qG7AkRFupgtQhVrGpXZA6dWfZA5wyQ7FjJpNkLtDvChptv6GxymzfapdnrDwZDZD"
## @../app-config.json

## get profile properties
# curl -X GET "https://graph.facebook.com/v2.6/me/messenger_profile?fields=get_started&access_token=EAAIEcEbBR0QBAISsLDXDHyBGo1otUaBlvhWx0z2y9zSyjKG7lZBnTjrRJeEw888B39hWWaxldZCByfFW1M8tdi8ImOSUyf3naaW1GmVyGqaNG3qG7AkRFupgtQhVrGpXZA6dWfZA5wyQ7FjJpNkLtDvChptv6GxymzfapdnrDwZDZD"
