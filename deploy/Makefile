CACHE ?=
build:
	docker build $(CACHE) -t nsunina/dsp .


run: build
	docker run --net=host -v ~/.dsp:/root/.dsp -v /var/run/docker.sock:/var/run/docker.sock --rm -it --name dsp -p 18181:18181 nsunina/dsp

rm:
	docker rm -f dsp