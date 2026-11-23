# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine
# The nginx image replaces ${BACKEND_URL} in this template when the container starts.
ENV BACKEND_URL=http://backend:9096
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/banking-frontend/browser /usr/share/nginx/html
EXPOSE 80
