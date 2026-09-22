# nginx + geoip2: страна визита по IP без внешних сервисов.
# База DB-IP Country Lite (CC BY 4.0), без аккаунта и ключа. Обновляется при каждой пересборке образа.
FROM alpine:3.20
RUN apk add --no-cache nginx nginx-mod-http-geoip2 curl \
 && mkdir -p /usr/share/GeoIP /run/nginx \
 && for m in "$(date +%Y-%m)" "$(date -d '-1 month' +%Y-%m 2>/dev/null || date -v-1m +%Y-%m)"; do \
      curl -fsSL "https://download.db-ip.com/free/dbip-country-lite-$m.mmdb.gz" | gunzip > /usr/share/GeoIP/dbip-country-lite.mmdb && break; \
    done \
 && test -s /usr/share/GeoIP/dbip-country-lite.mmdb
CMD ["nginx", "-g", "daemon off;"]
