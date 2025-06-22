FROM node:22.16

# Install required packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    docker.io \
    docker-compose \
    && rm -rf /var/lib/apt/lists/*

# create the working directory
# RUN mkdir -p /opt/DSP

# Copy the source in the DSP directory
COPY ./. opt/DSP

WORKDIR /opt/DSP

# Install backend dependencies
RUN npm install


# Expose DSP default port
EXPOSE 18181

# Start the DSP backend
CMD ["npm", "start"]()
