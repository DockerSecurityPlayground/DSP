CACHE ?=
VERSION ?= 3.10.0
PLATFORMS ?= linux/amd64,linux/arm64

build:
	docker build $(CACHE) -t nsunina/dsp:$(VERSION) .


push: build
	docker push nsunina/dsp:$(VERSION)

push-multi:
	docker buildx create --name multi --use --bootstrap 2>/dev/null || docker buildx use multi
	docker buildx build --platform $(PLATFORMS) -t nsunina/dsp:$(VERSION) --push .

run: build
	docker run -v /var/run/docker.sock:/var/run/docker.sock \
	-v dsp_data:/var/dsp \
	-e DSP_BASEDIR=/var \
	-e DSP_AUTOINSTALL=1 \
	--rm -it --name dsp \
	--net=host \
	nsunina/dsp:$(VERSION)

volume_clean:
	docker volume rm dsp_data
clean: volume_clean
	docker rm -f dsp
	docker rmi -f nsunina/dsp:$(VERSION)
