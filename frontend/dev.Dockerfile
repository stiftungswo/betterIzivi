FROM node:10.15.3-alpine as building-stage

COPY package.json ./package.json
COPY yarn.lock ./yarn.lock
RUN yarn install
COPY . .
RUN yarn run build

RUN sed -i'' "s,BASE_URL,localhost:23000,g" build/static/js/main.*.js

# Serving
FROM httpd:2.4-alpine as production-stage

COPY --from=building-stage /build /usr/local/apache2/htdocs/
COPY htaccess.dist /usr/local/apache2/htdocs/.htaccess

RUN sed -i '/LoadModule rewrite_module/s/^#//g' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's#AllowOverride [Nn]one#AllowOverride All#' /usr/local/apache2/conf/httpd.conf

EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
