from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# ── Kilele ERP admin branding ──────────────────────
admin.site.site_header  = "Kilele ERP"          # top-left banner text
admin.site.site_title   = "Kilele ERP Portal"   # browser tab title
admin.site.index_title  = "Welcome to Kilele ERP Administration"  # dashboard heading

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)