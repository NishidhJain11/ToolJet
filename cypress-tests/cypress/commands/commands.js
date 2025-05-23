import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { ssoSelector } from "Selectors/manageSSO";
import { commonText, createBackspaceText } from "Texts/common";
import { passwordInputText } from "Texts/passwordInput";
import { importSelectors } from "Selectors/exportImport";
import { importText } from "Texts/exportImport";
import { onboardingSelectors } from "Selectors/onboarding";

Cypress.Commands.add(
  "appUILogin",
  (email = "dev@tooljet.io", password = "password") => {
    const API_ENDPOINT =
      Cypress.env("environment") === "Community"
        ? "/api/library_apps/"
        : "/api/library_apps";
    cy.visit("/");
    cy.wait(1000);
    cy.clearAndType(onboardingSelectors.loginEmailInput, email);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, password);
    cy.get(onboardingSelectors.signInButton).click();

    cy.intercept("GET", API_ENDPOINT).as("library_apps");
    cy.get(commonSelectors.homePageLogo, { timeout: 10000 });
    cy.wait("@library_apps");
  }
);

Cypress.Commands.add("clearAndType", (selector, text) => {
  cy.get(selector, { timeout: 20000 }).clear();
  cy.get(selector).type(text, { log: false });
});

Cypress.Commands.add("forceClickOnCanvas", () => {
  cy.get(commonSelectors.canvas).click("topRight", { force: true });
});

Cypress.Commands.add(
  "verifyToastMessage",
  (selector, message, closeAction = true) => {
    cy.get(selector).as("toast").should("contain.text", message);
    if (closeAction) {
      cy.get("body").then(($body) => {
        if ($body.find(commonSelectors.toastCloseButton).length > 0) {
          cy.closeToastMessage();
          cy.wait(200);
        }
      });
    }
  }
);

Cypress.Commands.add("waitForAutoSave", () => {
  cy.wait(200);
  cy.get(commonSelectors.autoSave, { timeout: 20000 }).should(
    "have.text",
    commonText.autoSave,
    { timeout: 20000 }
  );
});

Cypress.Commands.add("createApp", (appName) => {
  const getAppButtonSelector = ($title) =>
    $title.text().includes(commonText.introductionMessage)
      ? commonSelectors.emptyAppCreateButton
      : commonSelectors.appCreateButton;

  cy.get("body").then(($title) => {
    cy.get(getAppButtonSelector($title)).click();
    cy.clearAndType('[data-cy="app-name-input"]', appName);
    cy.get('[data-cy="+-create-app"]').click();
  });
  cy.waitForAppLoad();
  cy.skipEditorPopover();
});

Cypress.Commands.add(
  "dragAndDropWidget",
  (
    widgetName,
    positionX = 80,
    positionY = 80,
    widgetName2 = widgetName,
    canvas = commonSelectors.canvas
  ) => {
    const dataTransfer = new DataTransfer();
    cy.forceClickOnCanvas();

    cy.clearAndType(commonSelectors.searchField, widgetName);
    cy.get(commonWidgetSelector.widgetBox(widgetName2)).trigger(
      "dragstart",
      { dataTransfer },
      { force: true }
    );
    cy.get(canvas).trigger("drop", positionX, positionY, {
      dataTransfer,
      force: true,
    });
    cy.waitForAutoSave();
  }
);

Cypress.Commands.add(
  "clearAndTypeOnCodeMirror",
  { prevSubject: "optional" },
  (subject, value) => {
    cy.wrap(subject)
      .realClick()
      .find(".cm-line")
      .invoke("text")
      .then((text) => {
        cy.wrap(subject)
          .last()
          .click()
          .type(createBackspaceText(text), { delay: 0 });
      });

    const splitIntoFlatArray = (value) => {
      const regex = /(\{|\}|\(|\)|\[|\]|,|:|;|=>|'[^']*'|[a-zA-Z0-9._]+|\s+)/g;
      let prefix = "";
      return (
        value.match(regex)?.reduce((acc, part) => {
          if (part === "{{" || part === "((") {
            prefix = "{backspace}{backspace}";
            acc.push(part);
          } else if (part === "{" || part === "(" || part === "[") {
            acc.push(prefix + part);
            prefix = "{backspace}";
          } else if (part === "}}") {
            acc.push(prefix + part);
          } else if (part === " ") {
            acc.push(prefix + " ");
          } else if (part === ":") {
            acc.push(prefix + ":");
          } else {
            acc.push(prefix + part);
            prefix = "";
          }
          return acc;
        }, []) || []
      );
    };

    if (Array.isArray(value)) {
      cy.wrap(subject)
        .last()
        .realType(value, {
          parseSpecialCharSequences: false,
          delay: 0,
          force: true,
        });
    } else {
      splitIntoFlatArray(value).forEach((i) => {
        cy.wrap(subject)
          .last()
          .click()
          .realType(
            `{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}${i}`,
            { parseSpecialCharSequences: false, delay: 0, force: true }
          );
      });
    }
  }
);

Cypress.Commands.add("deleteApp", (appName) => {
  cy.intercept("DELETE", "/api/apps/*").as("appDeleted");
  cy.get(commonSelectors.appCard(appName))
    .realHover()
    .find(commonSelectors.appCardOptionsButton)
    .realHover()
    .click();
  cy.get(commonSelectors.deleteAppOption).click();
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  cy.wait("@appDeleted");
});

Cypress.Commands.add(
  "verifyVisibleElement",
  {
    prevSubject: "element",
  },
  (subject, assertion, value, ...arg) => {
    return cy
      .wrap(subject, { timeout: 10000 })
      .scrollIntoView({ timeout: 10000 })
      .should("be.visible", { timeout: 10000 })
      .and(assertion, value, ...arg);
  }
);

Cypress.Commands.add("openInCurrentTab", (selector) => {
  cy.get(selector).invoke("removeAttr", "target").click();
});

Cypress.Commands.add("modifyCanvasSize", (x, y) => {
  cy.get("[data-cy='left-sidebar-settings-button']").click();
  cy.clearAndType("[data-cy='maximum-canvas-width-input-field']", x);
  cy.forceClickOnCanvas();
});

Cypress.Commands.add("createAppFromTemplate", (appName) => {
  cy.get('[data-cy="import-dropdown-menu"]').click();
  cy.get('[data-cy="choose-from-template-button"]').click();
  cy.get(`[data-cy="${appName}-list-item"]`).click();
  cy.get('[data-cy="create-application-from-template-button"]').click();
  cy.get('[data-cy="app-name-label"]').should("have.text", "App Name");
});

Cypress.Commands.add("renameApp", (appName) => {
  cy.get(commonSelectors.appNameInput).type(
    `{selectAll}{backspace}${appName}`,
    { force: true }
  );
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
});

Cypress.Commands.add(
  "clearCodeMirror",
  {
    prevSubject: "element",
  },
  (subject, value) => {
    cy.wrap(subject)
      .realClick()
      .find(".cm-line")
      .invoke("text")
      .then((text) => {
        cy.wrap(subject).realType(createBackspaceText(text)),
        {
          delay: 0,
        };
      });
  }
);

Cypress.Commands.add("closeToastMessage", () => {
  cy.get(`${commonSelectors.toastCloseButton}:eq(0)`).click();
});

Cypress.Commands.add("notVisible", (dataCy) => {
  cy.get("body").then(($body) => {
    if ($body.find(dataCy).length > 0) {
      cy.get(dataCy).should("not.be.visible");
    }
  });
  const log = Cypress.log({
    name: "notVisible",
    displayName: "Not Visible",
    message: dataCy,
  });
});

Cypress.Commands.add(
  "resizeWidget",
  (widgetName, x, y, autosaveStatusCheck = true) => {
    cy.get(`[data-cy="draggable-widget-${widgetName}"]`).trigger("mouseover", {
      force: true,
    });

    cy.get('[class="bottom-right"]').trigger("mousedown", {
      which: 1,
      force: true,
    });
    cy.get(commonSelectors.canvas)
      .trigger("mousemove", {
        which: 1,
        clientX: x,
        ClientY: y,
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y,
        screenX: x,
        screenY: y,
      })
      .trigger("mouseup");
    if (autosaveStatusCheck) {
      cy.waitForAutoSave();
    }
  }
);

Cypress.Commands.add("reloadAppForTheElement", (elementText) => {
  cy.get("body").then(($title) => {
    if (!$title.text().includes(elementText)) {
      cy.reload();
    }
  });
});

Cypress.Commands.add("skipEditorPopover", () => {
  cy.wait(1000);
  cy.get("body").then(($el) => {
    if ($el.text().includes("Skip", { timeout: 2000 })) {
      cy.get(commonSelectors.skipButton).realClick();
    }
  });
  const log = Cypress.log({
    name: "Skip Popover",
    displayName: "Skip Popover",
    message: " Popover skipped",
  });
});

Cypress.Commands.add("waitForAppLoad", () => {
  const API_ENDPOINT =
    Cypress.env("environment") === "Community"
      ? "/api/v2/data_sources"
      : "/api/app-environments**";

  const TIMEOUT = 15000;

  cy.intercept("GET", API_ENDPOINT).as("appDs");
  cy.wait("@appDs", { timeout: TIMEOUT });
});

Cypress.Commands.add("visitTheWorkspace", (workspaceName) => {
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select id from organizations where name='${workspaceName}';`,
  }).then((resp) => {
    let workspaceId = resp.rows[0].id;
    cy.visit(workspaceId);
  });
  cy.wait(2000);
});

Cypress.Commands.add("hideTooltip", () => {
  cy.get("body").then(($body) => {
    if ($body.find(".tooltip-inner").length > 0) {
      cy.get(".tooltip-inner").invoke("css", "display", "none");
    }
  });
});

Cypress.Commands.add("importApp", (appFile) => {
  cy.get(importSelectors.dropDownMenu).should("be.visible").click();
  cy.get(importSelectors.importOptionInput).eq(0).selectFile(appFile, {
    force: true,
  });
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    importText.appImportedToastMessage
  );
});

Cypress.Commands.add("moveComponent", (componentName, x, y) => {
  cy.get(`[data-cy="draggable-widget-${componentName}"]`, { log: false })
    .trigger("mouseover", {
      force: true,
      log: false,
    })
    .trigger("mousedown", {
      which: 1,
      force: true,
      log: false,
    });
  cy.get(commonSelectors.canvas, { log: false })
    .trigger("mousemove", {
      which: 1,
      clientX: x,
      ClientY: y,
      clientX: x,
      clientY: y,
      pageX: x,
      pageY: y,
      screenX: x,
      screenY: y,
      log: false,
    })
    .trigger("mouseup", { log: false });

  const log = Cypress.log({
    name: "moveComponent",
    displayName: "Component moved:",
    message: `X: ${x}, Y:${y}`,
  });
});

Cypress.Commands.add("getPosition", (componentName) => {
  cy.get(commonWidgetSelector.draggableWidget(componentName)).then(
    ($element) => {
      const element = $element[0];
      const rect = element.getBoundingClientRect();

      const clientX = Math.round(rect.left + window.scrollX + rect.width / 2);
      const clientY = Math.round(rect.top + window.scrollY + rect.height / 2);

      const log = Cypress.log({
        name: "getPosition",
        displayName: `${componentName}'s Position:\n`,
        message: `\nX: ${clientX}, Y:${clientY}`,
      });
      return [clientX, clientY];
    }
  );
});

Cypress.Commands.add("defaultWorkspaceLogin", () => {
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `
      SELECT id FROM organizations WHERE name = 'My workspace';
    `,
  }).then((resp) => {
    const workspaceId = resp.rows[0].id;
    cy.apiLogin("dev@tooljet.io", "password", workspaceId, "/my-workspace");

    cy.visit("/");
    cy.intercept("GET", "/api/library_apps").as("library_apps");
    cy.get(commonSelectors.homePageLogo, { timeout: 10000 });
    cy.wait("@library_apps");
  });
});

Cypress.Commands.add(
  "visitSlug",
  ({
    actualUrl,
    currentUrl = `${Cypress.config("baseUrl")}/error/unknown`,
  }) => {
    // Ensure actualUrl is provided
    if (!actualUrl) {
      throw new Error("actualUrl is required for visitSlug command.");
    }

    cy.visit(actualUrl);

    // Dynamically wait for the correct URL or handle navigation errors
    cy.url().then((url) => {
      if (url === currentUrl) {
        cy.log(`Navigation resulted in unexpected URL: ${url}. Retrying...`);
        cy.visit(actualUrl);
      }
    });
  }
);

Cypress.Commands.add("releaseApp", () => {
  if (Cypress.env("environment") !== "Community") {
    cy.get(commonEeSelectors.promoteButton).click();
    cy.get(commonEeSelectors.promoteButton).eq(1).click();
    cy.waitForAppLoad();
    cy.wait(3000);
    cy.get(commonEeSelectors.promoteButton).click();
    cy.get(commonEeSelectors.promoteButton).eq(1).click();
    cy.waitForAppLoad();
    cy.wait(3000);
  }
  cy.get(commonSelectors.releaseButton).click();
  cy.get(commonSelectors.yesButton).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, "Version v1 released");
  cy.wait(1000);
});

Cypress.Commands.add("backToApps", () => {
  cy.get(commonSelectors.editorPageLogo).click();
  cy.get(commonSelectors.backToAppOption).click();
  cy.intercept("GET", "/api/library_apps/").as("library_apps");
  cy.get(commonSelectors.homePageLogo, { timeout: 10000 });
  cy.wait("@library_apps");
});

Cypress.Commands.add("removeAssignedApps", () => {
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `DELETE FROM app_group_permissions;`,
  });
});

Cypress.Commands.add(
  "saveFromIntercept",
  (interceptAlias, property, envVariable) => {
    cy.get(interceptAlias)
      .its("response.body")
      .then((responseBody) => {
        Cypress.env(envVariable, responseBody[property]);
      });
  }
);

Cypress.Commands.add("verifyLabel", (labelName) => {
  cy.get(commonSelectors.label(`${labelName}`)).verifyVisibleElement(
    "have.text",
    labelName
  );
});

Cypress.Commands.add(
  "verifyCssProperty",
  (selector, property, expectedValue) => {
    cy.get(selector).should("have.css", property).and("eq", expectedValue);
  }
);

Cypress.Commands.add("skipWalkthrough", () => {
  cy.window({ log: false }).then((win) => {
    win.localStorage.setItem("walkthroughCompleted", "true");
  });
});

Cypress.Commands.add("appPrivacy", (appName, isPublic) => {
  const isPublicValue = isPublic ? "true" : "false";
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `UPDATE apps SET is_public = ${isPublicValue} WHERE name = '${appName}';`,
  });
});

Cypress.Commands.overwrite(
  "intercept",
  (originalFn, method, endpoint, ...rest) => {
    const isSubpath = Cypress.config("baseUrl")?.includes("/apps");
    const cleanEndpoint = endpoint.startsWith("/apps")
      ? endpoint.replace("/apps", "")
      : endpoint;
    const fullUrl = isSubpath ? `/apps${cleanEndpoint}` : cleanEndpoint;

    return originalFn(method, fullUrl, ...rest);
  }
);

Cypress.Commands.add("verifyElement", (selector, text, eqValue) => {
  const element =
    eqValue !== undefined ? cy.get(selector).eq(eqValue) : cy.get(selector);
  element.should("be.visible").and("have.text", text);
});

Cypress.Commands.add("loginWithCredentials", (email, password) => {
  cy.get(onboardingSelectors.loginEmailInput, { timeout: 20000 }).should(
    "be.visible"
  );
  cy.clearAndType(onboardingSelectors.loginEmailInput, email);
  cy.clearAndType(onboardingSelectors.loginPasswordInput, password);
  cy.get(onboardingSelectors.signInButton).click();
});

Cypress.Commands.add("getAppId", (appName) => {
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select id from apps where name='${appName}';`,
  }).then((resp) => {
    const appId = resp.rows[0]?.id;
    return appId;
  });
});
