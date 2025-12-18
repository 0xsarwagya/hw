import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import clsx from "clsx";
import styles from "./index.module.css";

function HomepageHeader() {
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          VCEcom Documentation
        </Heading>
        <p className="hero__subtitle">
          Complete guide to the VCEcom ecommerce backend platform
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/introduction"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <Layout
      title="VCEcom Documentation"
      description="Lightweight ecommerce backend built with NestJS, Drizzle ORM, and Next.js"
    >
      <HomepageHeader />
      <main>
        <div className="container margin-vert--lg">
          <div className="row">
            <div className="col col--4 margin-bottom--lg">
              <div className="card">
                <div className="card__header">
                  <Heading as="h3">System Architecture</Heading>
                </div>
                <div className="card__body">
                  <p>
                    Learn about the modular architecture, component
                    interactions, and cross-module dependencies.
                  </p>
                  <Link to="/architecture/overview">View Architecture →</Link>
                </div>
              </div>
            </div>
            <div className="col col--4 margin-bottom--lg">
              <div className="card">
                <div className="card__header">
                  <Heading as="h3">Authentication</Heading>
                </div>
                <div className="card__body">
                  <p>
                    Secure admin authentication with 2FA, session management,
                    and activity logging.
                  </p>
                  <Link to="/authentication/admin-auth">View Auth Docs →</Link>
                </div>
              </div>
            </div>
            <div className="col col--4 margin-bottom--lg">
              <div className="card">
                <div className="card__header">
                  <Heading as="h3">API Reference</Heading>
                </div>
                <div className="card__body">
                  <p>
                    Complete API documentation for admin and storefront
                    endpoints.
                  </p>
                  <Link to="/api-reference/admin-api">View API Docs →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
