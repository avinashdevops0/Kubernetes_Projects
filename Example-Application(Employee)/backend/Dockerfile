# ---------- Build Stage ----------
FROM node:alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# ---------- Production Stage ----------
FROM node:alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy built app with correct ownership
COPY --from=build --chown=app:app /app ./

USER app

CMD ["npm", "start"]
