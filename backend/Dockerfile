FROM node:20-alpine

ARG DIRECT_URL

# Create a non-root user and group
RUN addgroup app && adduser -S app -G app

# Set the user to run the app
USER app

WORKDIR /app

COPY package.json package-lock.json ./

# Sometimes the owner of the files is root, and the app cannot access the files,so we need to change the owner to the app user
USER root

RUN chown -R app:app /app

# Now after changing the owner, we need to set the user back to the app user
USER app

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
