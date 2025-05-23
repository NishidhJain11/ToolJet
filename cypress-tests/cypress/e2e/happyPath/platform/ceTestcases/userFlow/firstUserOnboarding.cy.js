import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { onboardingText } from "Texts/onboarding";
import { logout } from "Support/utils/common";
import { bannerElementsVerification } from "Support/utils/onboarding";

describe("Self host onboarding", () => {
  const envVar = Cypress.env("environment");

  beforeEach(() => {
    cy.visit("/setup");
  });

  it("verify elements on self host onboarding page", () => {
    if (envVar === "Enterprise") {
      cy.get(commonSelectors.HostBanner).should("be.visible");
      cy.get(commonSelectors.pageLogo).should("be.visible");
      cy.get('[data-cy="welcome-to-tooljet!-header"]').verifyVisibleElement(
        "have.text",
        "Welcome to ToolJet!"
      );
      cy.get(onboardingSelectors.pageDescription).verifyVisibleElement(
        "have.text",
        "Let's set up your admin account and workspace to get started!"
      );
      cy.get('[data-cy="set-up-tooljet-button"]')
        .verifyVisibleElement("have.text", "Set up ToolJet")
        .click();
    }

    const commonElements = [
      { selector: commonSelectors.HostBanner },
      { selector: commonSelectors.pageLogo },
      { selector: commonSelectors.signupTerms },
      { selector: commonSelectors.nameInputField },
      { selector: onboardingSelectors.emailInput },
      { selector: onboardingSelectors.passwordInput },
    ];

    commonElements.forEach((element) => {
      cy.get(element.selector).should("be.visible");
    });

    const labelChecks = [
      {
        selector: commonSelectors.adminSetup,
        text: "Set up your admin account",
      },
      {
        selector: commonSelectors.userNameInputLabel,
        text: commonText.userNameInputLabel,
      },
      {
        selector: commonSelectors.emailInputLabel,
        text: commonText.emailInputLabel,
      },
      {
        selector: commonSelectors.passwordLabel,
        text: commonText.passwordLabel,
      },
      {
        selector: commonSelectors.passwordHelperTextSignup,
        text: commonText.passwordHelperText,
      },
    ];

    labelChecks.forEach((check) => {
      cy.get(check.selector).verifyVisibleElement("have.text", check.text);
    });

    if (envVar === "Community") {
      cy.get(commonSelectors.signUpTermsHelperText).should(($el) => {
        expect($el.contents().first().text().trim()).to.eq(
          commonText.selfHostSignUpTermsHelperText
        );
      });
    } else if (envVar === "Enterprise") {
      cy.get(commonSelectors.signUpTermsHelperText).should(($el) => {
        expect($el.contents().first().text().trim()).to.eq(
          "By signing up you are agreeing to the"
        );
      });
    }

    const links = [
      {
        selector: commonSelectors.termsOfServiceLink,
        text: commonText.termsOfServiceLink,
        href: "https://www.tooljet.com/terms",
      },
      {
        selector: commonSelectors.privacyPolicyLink,
        text: commonText.privacyPolicyLink,
        href: "https://www.tooljet.com/privacy",
      },
    ];

    links.forEach((link) => {
      cy.get(link.selector)
        .verifyVisibleElement("have.text", link.text)
        .and("have.attr", "href")
        .and("equal", link.href);
    });

    cy.get(commonSelectors.nameInputField).type("The Developer");
    cy.get(onboardingSelectors.emailInput).type("dev@tooljet.io");
    cy.get(onboardingSelectors.passwordInput).type("password");
    cy.get(commonSelectors.continueButton).click();

    if (envVar === "Enterprise") {
      bannerElementsVerification();

      const companyPageTexts = [
        {
          selector: onboardingSelectors.tellUsAbit,
          text: "Tell us a bit about yourself",
        },
        {
          selector: onboardingSelectors.pageDescription,
          text: "This information will help us improve ToolJet",
        },
        {
          selector: '[data-cy="onboarding-company-name-label"]',
          text: "Company name *",
        },
        {
          selector: '[data-cy="onboarding-build-purpose-label"]',
          text: "What would you like to build on ToolJet? *",
        },
      ];

      companyPageTexts.forEach((item) => {
        cy.get(item.selector).should("be.visible").and("have.text", item.text);
      });

      cy.get(onboardingSelectors.companyNameInput).should("be.visible");
      cy.get(onboardingSelectors.buildPurposeInput).should("be.visible");
      cy.get(onboardingSelectors.onboardingSubmitButton).verifyVisibleElement(
        "have.attr",
        "disabled"
      );

      cy.get(onboardingSelectors.companyNameInput).type("Tooljet");
      cy.get(onboardingSelectors.onboardingSubmitButton).should(
        "have.attr",
        "disabled"
      );
      cy.get(onboardingSelectors.buildPurposeInput).type("Exploring");
      cy.get(onboardingSelectors.onboardingSubmitButton).verifyVisibleElement(
        "have.text",
        "Continue"
      );
      cy.get(onboardingSelectors.onboardingSubmitButton)
        .should("be.enabled")
        .click();
    }

    bannerElementsVerification();
    cy.get(commonSelectors.setUpworkspaceCheckPoint)
      .should("be.visible")
      .and("have.text", "Set up your workspace!");

    cy.get(onboardingSelectors.pageDescription).verifyVisibleElement(
      "have.text",
      "Set up workspaces to manage users, applications & resources across various teams"
    );
    cy.get(commonSelectors.workspaceNameInputLabel)
      .should("be.visible")
      .and("have.text", commonText.workspaceNameInputLabel);
    cy.clearAndType(commonSelectors.workspaceNameInputField, "My workspace");
    cy.get(commonSelectors.OnbordingContinue)
      .verifyVisibleElement("have.text", "Continue")
      .click();

    if (envVar === "Enterprise") {
      bannerElementsVerification();

      const trialPageTexts = [
        {
          selector: onboardingSelectors.beforeDiveInHeader,
          text: onboardingText.freeTrialHeaderText,
        },
        {
          selector: onboardingSelectors.infoDescription,
          text: onboardingText.infoDescriptionText,
        },
        {
          selector: onboardingSelectors.noCreditCardBanner,
          text: onboardingText.noCreditCardText,
        },
        {
          selector: onboardingSelectors.trialButton,
          text: "Start your 14-day trial",
        },
        { selector: onboardingSelectors.declineButton, text: "No, thanks" },
      ];

      trialPageTexts.forEach((item) => {
        cy.get(item.selector).should("be.visible").and("have.text", item.text);
      });

      cy.get(onboardingSelectors.comparePlansTitle).verifyVisibleElement(
        "have.text",
        onboardingText.comparePlansText
      );

      cy.get(onboardingSelectors.comparePlanDescription)
        .invoke("text")
        .then((text) => {
          const normalizedText = text.replace(/\s+/g, " ").trim();
          expect(normalizedText).to.equal(
            "The plan reflects the features available in the latest version of ToolJet and some feature may not be available in your version. Click here to check out the details plan comparison & prices on our website."
          );
        });

      cy.get(onboardingSelectors.onPremiseLink)
        .verifyVisibleElement("have.text", "Click here")
        .and("have.attr", "href")
        .and("equal", "https://www.tooljet.com/pricing?payment=onpremise");

      const planTitles = [
        {
          selector: onboardingSelectors.basicPlanTitle,
          text: onboardingText.basicPlanText,
        },
        {
          selector: onboardingSelectors.flexibleTitle,
          text: onboardingText.flexibleText,
        },
        {
          selector: onboardingSelectors.businessTitle,
          text: onboardingText.businessText,
        },
      ];

      planTitles.forEach((item) => {
        cy.get(item.selector).should("be.visible").and("have.text", item.text);
      });

      const prices = [
        { selector: `${onboardingSelectors.planPrice}:eq(0)`, text: "$0" },
        { selector: `${onboardingSelectors.planPrice}:eq(1)`, text: "$30" },
      ];

      prices.forEach((item) => {
        cy.get(item.selector).should("be.visible").and("have.text", item.text);
      });

      cy.get(onboardingSelectors.planToggleInput).should("be.visible");
      cy.get(onboardingSelectors.planToggleLabel).verifyVisibleElement(
        "have.text",
        "Yearly20% off"
      );
      cy.get(onboardingSelectors.discountDetails).verifyVisibleElement(
        "have.text",
        "20% off"
      );

      cy.get(onboardingSelectors.builderPrice).verifyVisibleElement(
        "have.text",
        "$24"
      );
      cy.get('[data-cy="builder-price-period"]').verifyVisibleElement(
        "have.text",
        onboardingText.priceMonthlyText
      );
      cy.get('[data-cy="builder-price-description"]').verifyVisibleElement(
        "have.text",
        "per builder"
      );

      cy.get(onboardingSelectors.endUserPrice).verifyVisibleElement(
        "have.text",
        "$8"
      );
      cy.get('[data-cy="enduser-price-period"]').verifyVisibleElement(
        "have.text",
        onboardingText.priceMonthlyText
      );
      cy.get('[data-cy="enduser-price-description"]').verifyVisibleElement(
        "have.text",
        "per end user"
      );

      cy.get(onboardingSelectors.pricingPlanToggle).uncheck({ force: true });

      cy.get(onboardingSelectors.planToggleLabel)
        .first()
        .verifyVisibleElement("have.text", "Monthly20% off");
      cy.get(onboardingSelectors.discountDetails)
        .should("have.css", "text-decoration")
        .and("include", "line-through");

      cy.get(onboardingSelectors.builderPrice).verifyVisibleElement(
        "have.text",
        "$30"
      );
      cy.get(onboardingSelectors.endUserPrice).verifyVisibleElement(
        "have.text",
        "$10"
      );

      cy.get(onboardingSelectors.enterpriseTitle).verifyVisibleElement(
        "have.text",
        "Enterprise"
      );
      cy.get(onboardingSelectors.customPricingHeader).verifyVisibleElement(
        "have.text",
        "Custom pricing"
      );
      cy.get('[data-cy="schedule-a-call-button"]').verifyVisibleElement(
        "have.text",
        "Schedule a call"
      );

      cy.get(onboardingSelectors.declineButton).click();

      bannerElementsVerification();
      cy.get(
        `[data-cy="we've-created-a-sample-application-for-you!-header"]`
      ).verifyVisibleElement(
        "have.text",
        "We've created a sample application for you!"
      );
      cy.get(onboardingSelectors.pageDescription).verifyVisibleElement(
        "have.text",
        "The sample application comes with a sample PostgreSQL database for you to play around with. You can also get started quickly with pre-built applications from our template collection!"
      );

      cy.get(onboardingSelectors.onboardingSubmitButton)
        .verifyVisibleElement("have.text", "Continue")
        .click();
    }

    cy.get(commonSelectors.skipbutton).click();
    cy.get(commonSelectors.backLogo).click();
    cy.get(commonSelectors.backtoapps).click();

    if (envVar === "Enterprise") {
      cy.get(".btn-close").click();
    }

    logout();
    cy.appUILogin();

    cy.get(commonSelectors.workspaceName)
      .should("be.visible")
      .and("have.text", "My workspace");
  });
});
