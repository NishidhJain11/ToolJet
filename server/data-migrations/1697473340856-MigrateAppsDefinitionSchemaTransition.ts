import { MigrationInterface, QueryRunner, EntityManager } from 'typeorm';
import { AppVersion } from '@entities/app_version.entity';
import { Component } from '@entities/component.entity';
import { Page } from '@entities/page.entity';
import { Layout } from '@entities/layout.entity';
import { EventHandler, Target } from '@entities/event_handler.entity';
import { DataQuery } from '@entities/data_query.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { v4 as uuid } from 'uuid';

interface AppResourceMappings {
  pagesMapping: Record<string, string>;
  componentsMapping: Record<string, string>;
}

export class MigrateAppsDefinitionSchemaTransition1697473340856 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const totalAppVersions = await queryRunner.manager.count(AppVersion);

    if (totalAppVersions === 0) {
      console.log('No app versions found. Skipping migration.');
      return;
    }

    await this.migrateAppsDefinition(queryRunner.manager);
  }

  private async migrateAppsDefinition(entityManager: EntityManager, queryRunner?: QueryRunner): Promise<void> {
    return dbTransactionWrap(async (entityManager: EntityManager) => {
      const appVersionRepository = entityManager.getRepository(AppVersion);
      const appVersions = await appVersionRepository.query(
        `SELECT id FROM app_versions WHERE definition->>'pages' IS NOT NULL ORDER BY updated_at DESC`
      );
      const totalVersions = appVersions.length;

      const startTime = new Date().getTime();
      const migrationProgress = new MigrationProgress(
        'MigrateAppsDefinitionSchemaTransition1697473340856',
        totalVersions
      );

      const batchSize = 100; // Number of apps to migrate at a time

      await processDataInBatches(
        entityManager,
        async (entityManager: EntityManager, skip: number, take: number) => {
          const ids = appVersions.slice(skip, skip + take).map((appVersion) => appVersion.id);
          if (!ids || ids.length === 0) {
            return [];
          }
          return entityManager.query(
            `SELECT * FROM app_versions WHERE id IN (${ids.map((id) => `'${id}'`).join(',')})`
          );
        },
        async (entityManager: EntityManager, versions: AppVersion[]) => {
          await this.processVersions(entityManager, versions, migrationProgress);
        },
        batchSize
      );

      const endTime = new Date().getTime();
      console.log(`Migration time taken: ${(endTime - startTime) / 1000} seconds`);
    }, entityManager);
  }

  private async processVersions(
    entityManager: EntityManager,
    versions: AppVersion[],
    migrationProgress: MigrationProgress
  ) {
    for (const version of versions) {
      const definition = version['definition'];

      const dataQueriesRepository = entityManager.getRepository(DataQuery);
      const dataQueries = await dataQueriesRepository.find({
        where: { appVersionId: version.id },
      });

      let updateHomepageId = null;

      const appResourceMappings: AppResourceMappings = {
        pagesMapping: {},
        componentsMapping: {},
      };
      if (definition?.pages && Object.keys(definition?.pages).length > 0) {
        for (const pageId of Object.keys(definition?.pages)) {
          const page = definition.pages[pageId];
          const pagePositionInTheList = Object.keys(definition?.pages).indexOf(pageId);
          const pageEvents = page.events || [];
          const pageComponents = page.components || {};

          const isHomepage = (definition['homePageId'] as any) === pageId;

          const componentEvents = [];
          const componentLayouts = [];
          let savedComponents = [];
          const transformedComponents = this.transformComponentData(
            pageComponents,
            componentEvents,
            appResourceMappings.componentsMapping
          );

          const newPage = entityManager.create(Page, {
            name: page.name || page.handle || pageId,
            handle: page.handle || pageId,
            appVersionId: version.id,
            disabled: page.disabled || false,
            hidden: page.hidden || false,
            index: pagePositionInTheList,
          });

          const pageCreated = await entityManager.save(newPage);

          appResourceMappings.pagesMapping[pageId] = pageCreated.id;

          if (Array.isArray(transformedComponents) && transformedComponents.length > 0) {
            transformedComponents.forEach((component) => {
              component.page = pageCreated;
            });

            savedComponents = await entityManager.save(Component, transformedComponents);

            for (const componentId in pageComponents) {
              const componentLayout = pageComponents[componentId]['layouts'];

              if (componentLayout && appResourceMappings.componentsMapping[componentId]) {
                for (const type in componentLayout) {
                  const layout = componentLayout[type];
                  const newLayout = new Layout();
                  newLayout.type = type;
                  newLayout.top = layout.top;
                  newLayout.left = layout.left;
                  newLayout.width = layout.width;
                  newLayout.height = layout.height;
                  newLayout.componentId = appResourceMappings.componentsMapping[componentId];

                  componentLayouts.push(newLayout);
                }
              }
            }

            await entityManager.save(Layout, componentLayouts);
          }

          if (Array.isArray(pageEvents) && pageEvents.length > 0) {
            pageEvents.forEach(async (event, index) => {
              const newEvent = {
                name: event.eventId || `${pageCreated.name} Page Event ${index}`,
                sourceId: pageCreated.id,
                target: Target.page,
                event: event,
                index: index,
                appVersionId: version.id,
              };

              await entityManager.save(EventHandler, newEvent);
            });
          }

          componentEvents.forEach((eventObj) => {
            if (eventObj.event?.length === 0) return;

            if (Array.isArray(eventObj.event) && eventObj.event.length > 0) {
              eventObj.event.forEach(async (event, index) => {
                const newEvent = {
                  name: event.eventId || `event ${index}`,
                  sourceId: appResourceMappings.componentsMapping[eventObj.componentId],
                  target: Target.component,
                  event: event,
                  index: index,
                  appVersionId: version.id,
                };

                await entityManager.save(EventHandler, newEvent);
              });
            }
          });

          if (savedComponents.length > 0) {
            savedComponents.forEach(async (component) => {
              if (component.type === 'Table') {
                const tableActions = component?.properties?.actions?.value || [];
                const tableColumns = component?.properties?.columns?.value || [];
                const tableActionAndColumnEvents = [];

                tableActions.forEach((action) => {
                  const actionEvents = action?.events || [];

                  if (!actionEvents || !Array.isArray(actionEvents)) return;

                  actionEvents.forEach((event, index) => {
                    tableActionAndColumnEvents.push({
                      name: event.eventId,
                      sourceId: component.id,
                      target: Target.tableAction,
                      event: { ...event, ref: action.name },
                      index: index,
                      appVersionId: version.id,
                    });
                  });
                });

                tableColumns.forEach((column) => {
                  if (column?.columnType !== 'toggle') return;
                  const columnEvents = column?.events || [];

                  if (!columnEvents || !Array.isArray(columnEvents)) return;

                  columnEvents.forEach((event, index) => {
                    tableActionAndColumnEvents.push({
                      name: event.eventId || `event ${index}`,
                      sourceId: component.id,
                      target: Target.tableColumn,
                      event: { ...event, ref: column.name },
                      index: index,
                      appVersionId: version.id,
                    });
                  });
                });

                await entityManager.save(EventHandler, tableActionAndColumnEvents);
              }
            });
          }

          if (isHomepage) {
            updateHomepageId = pageCreated.id;
          }
        }
      }

      for (const dataQuery of dataQueries) {
        const queryEvents = dataQuery?.options?.events || [];

        if (Array.isArray(queryEvents) && queryEvents.length > 0) {
          queryEvents.forEach(async (event, index) => {
            const newEvent = {
              name: event.eventId || `${dataQuery.name} Query Event ${index}`,
              sourceId: dataQuery.id,
              target: Target.dataQuery,
              event: event,
              index: index,
              appVersionId: version.id,
            };

            await entityManager.save(EventHandler, newEvent);
          });
        }
      }

      let globalSettings = definition?.globalSettings;
      if (!definition?.globalSettings) {
        globalSettings = {
          hideHeader: false,
          appInMaintenance: false,
          canvasMaxWidth: 100,
          canvasMaxWidthType: '%',
          canvasMaxHeight: 2400,
          canvasBackgroundColor: '#edeff5',
          backgroundFxQuery: '',
        };
      }

      await entityManager.update(
        AppVersion,
        { id: version.id },
        {
          homePageId: updateHomepageId,
          showViewerNavigation: definition?.showViewerNavigation || true,
          globalSettings: globalSettings,
        }
      );

      await this.updateEventActionsForNewVersionWithNewMappingIds(
        entityManager,
        version.id,
        appResourceMappings.componentsMapping,
        appResourceMappings.pagesMapping
      );

      migrationProgress.show();
    }
  }

  async updateEventActionsForNewVersionWithNewMappingIds(
    manager: EntityManager,
    versionId: string,
    oldComponentToNewComponentMapping: Record<string, unknown>,
    oldPageToNewPageMapping: Record<string, unknown>
  ) {
    const allEvents = await manager.find(EventHandler, {
      where: { appVersionId: versionId },
    });

    if (!allEvents || allEvents.length === 0) return;

    for (const event of allEvents) {
      const eventDefinition = event.event;

      if (eventDefinition?.actionId === 'switch-page') {
        eventDefinition.pageId = oldPageToNewPageMapping[eventDefinition.pageId];
      }

      if (eventDefinition?.actionId === 'control-component') {
        eventDefinition.componentId = oldComponentToNewComponentMapping[eventDefinition.componentId];
      }

      if (eventDefinition?.actionId == 'show-modal' || eventDefinition?.actionId === 'close-modal') {
        eventDefinition.modal = oldComponentToNewComponentMapping[eventDefinition.modal];
      }

      event.event = eventDefinition;

      await manager.save(event);
    }
  }

  private transformComponentData(
    data: object,
    componentEvents: any[],
    componentsMapping: Record<string, string>
  ): Component[] {
    if (!data || Object.keys(data).length == 0) return [];

    const transformedComponents: Component[] = [];

    const allComponents = Object.keys(data).map((key) => {
      if (!key) return;

      return {
        id: key,
        ...data[key],
      };
    });

    if (!allComponents || allComponents.length === 0) return [];

    for (const componentId in data) {
      if (!componentId || !data[componentId]) return;

      const component = data[componentId];

      const componentData = component['component'];

      if (!componentData?.component) return;

      let skipComponent = false;
      const transformedComponent: Component = new Component();

      let parentId = component?.parent ? component.parent : null;

      const isParentTabOrCalendar = this.isChildOfTabsOrCalendar(component, allComponents, parentId);

      if (isParentTabOrCalendar) {
        const childTabId = component?.parent.split('-')[component?.parent.split('-').length - 1];
        const _parentId = component?.parent?.split('-').slice(0, -1).join('-');
        const mappedParentId = componentsMapping[_parentId];

        parentId = mappedParentId ? `${mappedParentId}-${childTabId}` : null;
      } else if (this.isChildOfKanbanModal(component, allComponents, parentId)) {
        const _parentId = component?.parent?.split('-').slice(0, -1).join('-');
        const mappedParentId = componentsMapping[_parentId];

        parentId = mappedParentId ? `${mappedParentId}-modal` : null;
      } else {
        if (component.parent && !componentsMapping[parentId]) {
          skipComponent = true;
        }
        parentId = componentsMapping[parentId] ? componentsMapping[parentId] : null;
      }

      if (!skipComponent) {
        transformedComponent.id = uuid();
        transformedComponent.name = componentData.name || componentId;
        transformedComponent.type = componentData.component;
        transformedComponent.properties = componentData?.definition?.properties || {};
        transformedComponent.styles = componentData?.definition?.styles || {};
        transformedComponent.validation = componentData?.definition?.validation || {};
        transformedComponent.general = componentData?.definition?.general || {};
        transformedComponent.generalStyles = componentData?.definition?.generalStyles || {};
        transformedComponent.displayPreferences = componentData?.definition?.others || {};
        transformedComponent.parent = component?.parent ? parentId : null;

        transformedComponents.push(transformedComponent);

        componentEvents.push({
          componentId: componentId,
          event: componentData?.definition?.events || [],
        });
        componentsMapping[componentId] = transformedComponent.id;
      }
    }

    return transformedComponents;
  }

  isChildOfTabsOrCalendar = (component, allComponents = [], componentParentId = undefined) => {
    if (!component || allComponents.length === 0) return false;

    if (componentParentId && component) {
      const parentId = component?.parent?.split('-').slice(0, -1).join('-');

      const parentComponent = allComponents.find((comp) => comp.id === parentId);

      if (parentComponent) {
        return parentComponent?.component?.component === 'Tabs' || parentComponent?.component?.component === 'Calendar';
      }
    }

    return false;
  };

  isChildOfKanbanModal = (component, allComponents = [], componentParentId = undefined) => {
    if (!component || !componentParentId || !componentParentId.includes('modal')) return false;
    const parentId = component?.parent?.split('-').slice(0, -1).join('-');
    const parentComponent = allComponents.find((comp) => comp.id === parentId);

    if (parentComponent) {
      return parentComponent?.component?.component === 'Kanban';
    }

    return false;
  };

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM page');
    await queryRunner.query('DELETE FROM component');
    await queryRunner.query('DELETE FROM layout');
    await queryRunner.query('DELETE FROM event_handler');

    await queryRunner.query('ALTER TABLE app_versions DROP COLUMN IF EXISTS homePageId');
    await queryRunner.query('ALTER TABLE app_versions DROP COLUMN IF EXISTS globalSettings');
    await queryRunner.query('ALTER TABLE app_versions DROP COLUMN IF EXISTS showViewerNavigation');
  }
}
