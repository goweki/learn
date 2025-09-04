import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Youtube Channel",
    Svg: require("@site/static/img/logo.svg").default,
    description: (
      <>
        The youtube channel where we talk design, tech and everything
        innovation. Check it out{" "}
        <a href="https://www.youtube.com/@full.stacked">here</a>
      </>
    ),
  },
  {
    title: "L.I.S.A",
    Svg: require("@site/static/img/logo_lisa.svg").default,
    description: (
      <>
        Lisa (Legal Intelligent Support Assistant) is a legal assistant that
        leverages AI and an intuitive dashboard to improve productivity and
        communication within the legal space. Try it today{" "}
        <a href="https://lisa.goweki.com">here</a>
      </>
    ),
  },
  {
    title: "Built through Collaboration",
    Svg: require("@site/static/img/collaboration.svg").default,
    description: (
      <>
        Behind our initiatives is team of tech and management talent working
        together to share and build the future.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
