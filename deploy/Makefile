CACHE ?=
VERSION ?= 3.8.3
build:
	docker build $(CACHE) -t nsunina/dsp:$(VERSION) .

push: build
	docker push nsunina/dsp:$(VERSION)

run: build
	docker run --net=host -v ~/.dsp:/root/.dsp -v /var/run/docker.sock:/var/run/docker.sock --rm -it --name dsp -p 18181:18181 nsunina/dsp:$(VERSION)

rm:
	docker rm -f dsp