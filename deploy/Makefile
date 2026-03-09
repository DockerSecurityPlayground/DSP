CACHE ?=
VERSION ?= 3.8.3
PLATFORMS ?= linux/amd64,linux/arm64

build:
	docker build $(CACHE) -t nsunina/dsp:$(VERSION) .

push: build
	docker push nsunina/dsp:$(VERSION)

push-multi:
	docker buildx create --name multi --use --bootstrap 2>/dev/null || docker buildx use multi
	docker buildx build --platform $(PLATFORMS) -t nsunina/dsp:$(VERSION) --push .

run: build
	docker run -v ~/.dsp:/root/.dsp \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --rm -it --name dsp \
DSP_EXPOSED_PORTS := -p 18181:18181 \
	-p 21:21 \
	-p 69:69/udp \
	-p 1111:1111 \
	-p 2222:2222 \
	-p 5800:5800 \
	-p 8081:8081 \
	-p 8090:8090 \
	-p 8443:8443 \
	-p 14500:14500 \
	-p 26000:26000

CACHE ?=
VERSION ?= 3.8.3
PLATFORMS ?= linux/amd64,linux/arm64

build:
	docker build $(CACHE) -t nsunina/dsp:$(VERSION) .

push: build
	docker push nsunina/dsp:$(VERSION)

push-multi:
	docker buildx create --name multi --use --bootstrap 2>/dev/null || docker buildx use multi
	docker buildx build --platform $(PLATFORMS) -t nsunina/dsp:$(VERSION) --push .

run: build
	docker run -v ~/.dsp:/root/.dsp \
	-v /var/run/docker.sock:/var/run/docker.sock \
	--rm -it --name dsp \
	$(DSP_EXPOSED_PORTS) \
	nsunina/dsp:$(VERSION)

rm:
	docker rm -f dsp
  nsunina/dsp:$(VERSION)

rm:
	docker rm -f dsp