# Stage 1: Build the Next.js app
FROM node:18-bookworm AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY ./package*.json ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the Next.js app
RUN npm run build

# Stage 2: Serve the Next.js app
FROM node:18-bookworm AS runner

RUN apt-get update && apt-get install -y apt-transport-https ca-certificates curl gnupg && \
  curl -sLf --retry 3 --tlsv1.2 --proto "=https" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg && \
  echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | tee /etc/apt/sources.list.d/doppler-cli.list && \
  apt-get update && \
  apt-get -y install doppler

# Set the working directory inside the container
WORKDIR /app

# Install a lightweight HTTP server to serve the Next.js app
RUN npm install next

# Copy the built application from the builder stage
COPY --from=builder /app ./

# Expose the port on which Next.js will run
EXPOSE 3000

# Start the Next.js app
CMD ["doppler", "run", "--", "npm", "run", "start"]
