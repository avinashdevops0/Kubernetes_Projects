FROM nginx:alpine

# Create group and user
RUN addgroup -S app && adduser -S app -G app

# Copy static files
COPY . /usr/share/nginx/html/

# Give ownership to the new user
RUN chown -R app:app /usr/share/nginx/html \
    && chown -R app:app /var/cache/nginx \
    && chown -R app:app /var/run \
    && chown -R app:app /etc/nginx

# Switch to non-root user
USER app

CMD ["nginx", "-g", "daemon off;"]

# ⚠️ Important Note

# By default, NGINX runs on port 80, which requires root privileges.

# If you run as non-root:

# You must change nginx to use a higher port (e.g., 8080).

# # ---------- Build Stage ----------
# FROM node:alpine AS build

# WORKDIR /app

# # Install dependencies
# COPY package.json package-lock.json* ./
# RUN npm install

# # Copy source code
# COPY . .

# # Build production files
# RUN npm run build


# # ---------- Production Stage ----------
# FROM nginx:alpine

# # Remove default nginx static assets
# RUN rm -rf /usr/share/nginx/html/*

# # Copy build output to nginx html folder
# COPY --from=build /app/build /usr/share/nginx/html

# # Copy custom nginx config (for SPA routing)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]
