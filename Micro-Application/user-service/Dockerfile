FROM node:alpine AS build

WORKDIR /app

COPY package*.json ./

# Install all deps (including dev if you need build step)
RUN npm install --production

COPY . .

# ---- Production Image ----
FROM node:alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy files with correct ownership
COPY --from=build --chown=app:app /app .

USER app

EXPOSE 3001

CMD ["npm", "start"]