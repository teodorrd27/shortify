# Shortify
Read about the design decisions at the end. POST requests are also supported for extra functionality.

## Live Demo (GET address bar support)
**Encode (Click 👉)**: https://shortify.teoradu.com/encode?longURL=https://www.finn.com/de-DE/pdpb/toyota-aygox-11454-mysticschwarzmica

**Follow (Copy / Replace {shortParam} 👉)**: https://shortify.teoradu.com/{shortParam}

**Decode (Copy / Replace {shortParam} 👉)**: https://shortify.teoradu.com/decode?shortURL=https://shortify.teoradu.com/{shortParam}

## Run the code
### Local Development Setup

- Duplicate `.env.example` and rename it to `.env`. This will work as-is.

- Install dependencies:
```bash
npm i
```

- Start the development server with hot reload (TS):
```bash
npm run dev
```

### Production Setup

- Start the production server (JS):
```bash
npm run dev-js
```

### Testing

- Run unit, integration, e2e, and performance tests
(**note**: cron integration test might run for about 7 seconds):
```bash
npm run test
```

- Run API tests:
```bash
npm run test-api
```

### Postman (API documentation)

- Import the `Shortify.postman_collection.json` file located in `test/api` into Postman.

- Run a development build locally (as above).

- Run the collection or explore the available endpoints in the API documentation.

- POST requests are provided for extra functionality. For example: `POST /encode` allows you to pass query parameters as the `longURL` in the `body` of the request.

- You can change `BASE_URL` to `https://shortify.teoradu.com` to test against the deployed production build. Feel free to use the profiler with over 1000 requests per second in order to check the **rate-limiter** in production!

## Production Ready Setup

- Install and run the docker daemon on your machine. [Guidance](https://www.docker.com/get-started/)

- Run a development build locally:

```bash
npm run build-docker:dev
npm run exec-docker:dev
```

- Run a production build tagged for Elastic Container Registry locally:
```bash
npm run build:prod
npm run exec-docker:prod
```

## Automated Deployment (Advanced)

### Prerequisites
- Install AWS CLI on your machine. [Guidance](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)

- Authenticate and get credentials for the AWS CLI. [Guidance](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html)

- Set up a new public ECR repository. [Guidance](https://docs.aws.amazon.com/AmazonECR/latest/userguide/getting-started-cli.html#cli-create-repository)

- Set up an ECS cluster with ASG capacity provider for EC2 launch type. [Guidance](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/create-cluster.html)

- Set up an application load balancer and forward HTTPS traffic to a target group for your ECS cluster. [Guidance](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/create-application-load-balancer.html)

- Set up ACM certificate for your domain (FQDN). [Guidance](https://docs.aws.amazon.com/acm/latest/userguide/gs.html)

- Route your DNS to the application load balancer. [Guidance](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-elb-load-balancer.html)

- Create a new ECS task definition mapping the appropriate container / host ports. Make sure the correct target group is specified. [Guidance](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)

### Continuous / Automated Deployment

- Duplicate `.load_aws.sh.example` and rename it to `.load_aws.sh`.

- Populate appropriate values.
```bash
npm run deploy:prod
```

# Design Decisions
## Feature Overview
### Browser support - API Client support - Demo
I have decided to provide the encode and decode functionality as GET requests as well as POST in the absence of a frontend. This allows you to test it directly in the browser address bar. The POST requests would be used by API clients that require more functionality.

### 302 Redirect - Click Counter
I have also implemented a 302 redirect that allows you to follow the short URL automatically. A **click counter** is also implemented to track the number of times a short URL has been followed. The counter is not currently accessible via the API, however, in future, an admin endpoint could be added to allow for monitoring.

### Collision proof URL shortener
The data layer (repo) uses a hash function to generate a unique 8 character short URL parameter. The character set is limited to 62 characters (0-9, a-z, A-Z) to ensure that the hash is URL and user-friendly (base62 encoding). The system **supports encoding of duplicate** long URLs with a uniform hashing distribution (first 8 characters of a SHA256 hash). I am also using up to 10 salts to ensure that there is no hash collision in the event that 2 identical long URLs are encoded at exactly the same time allowing for astronomically improbable collisions.

### Automatic expiry
I have also implemented a cron job that runs every second and cleans up expired URLs. This is to ensure that the system does not store expired URLs indefinitely. The URL default expiry can be configured in the `.env` file. `.env.example` is set to 2 days.

### Rate Limiter
In the absence of authentication, I have added a fastify rate limiter that allows 1000 requests per second to defend against DoS attacks. This could be very easily tweaked depending on the expected load.

### Data storage
The `repo` uses a Singleton pattern, allowing us to ensure that there is only ever one instance accessing the data layer. Although, while storing data in memory, there is not much risk of data corruption, this would be a good practice if it were to be replaced by a database driver or ORM in future.

### Error handling
Input validation takes care of notifying the user if the request is invalid and provides helpful information to give a hint as to what went wrong.

### Security
Fastify helmet is used to secure the API by setting appropriate HTTP headers and guarding against XSS and other common attacks.
Validation is performed on input to escape any potential injection attacks. Specifically, I included the `isURL` validator from the `validator` package to ensure extra robustness in addition to the Zod schema.

### Overall project structure
For the purpose of maintaining a modular and testable pattern, the Fastify instance is decoupled and separately configured from the code that runs it (i.e. the `src/server.ts` entrypoint) inside of the `src/app.ts` file. This allows us to optionally add a rate limiter in production without having to do so when performance testing.

### Runtime abstractions
- **Handlers** for HTTP request handler logic.
- **Jobs** for performing periodic tasks.
- **Repos** for a separation of the data access layer (could be replaced by a database driver or ORM in future).
- **Schemas** for Zod assisted Fastify data input and serialisation validation.
- **Services** as the business logic layer.

### Data storage
The `repo` uses a Singleton pattern, allowing us to ensure that there is only ever one instance accessing the data layer. Although, while storing data in memory, there is not much risk of data corruption, this would be a good practice if it were to be replaced by a database driver or ORM in future.

### Error handling
Input validation takes care of notifying the user if the request is invalid and provides helpful information to give a hint as to what went wrong.

### Testing
I have added a comprehensive suite of unit, integration, e2e, and performance tests. The unit tests are run with `tap` and API tests are run using `newman`.
- **unit** - This is where the 100% coverage is achieved. Tap only reports coverage when it is less than 100%.
- **integration** - Scheduler for automatic expiry is tested. Error recovery is tested by simulating corrupt requests.
- **e2e** - A full `POST /encode` `POST /decode` (API client) lifecycle is tested.
- **performance** - The rate limiter is tested to ensure that it can block out malicious requests flooding the system within a single second. The memory strain is a load test to ensure that the system can handle high load and maintain functionality.
- **api** - Postman can be used to view the tests written for the API. Newman is used to execute the collection and its associated tests.

# Future Improvements

- **Authentication** - For a more featureful and monetised Client API, authentication should be required to identify and meter users.
- **Database** - The current data layer is in memory and not persistent. A database driver or ORM would be a good addition to allow for persistence, scalability, and data integrity.
- **Monitoring** - The system should be instrumented with a monitoring and observability tool such as [Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/).
- **CI/CD** - The system should be deployable using a CI/CD pipeline that can run tests and deploy to various environments.
- **WAF** - The system should be protected by a Web Application Firewall to defend against common attacks.
- **More features** - Expiry could be made manually configurable by the user. The short URL could also be made meaningful by leveraging a Large Language Model call to generate a short URL from a long URL in a semantic `dash-separated-format`.
