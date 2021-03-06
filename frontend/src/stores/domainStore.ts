// tslint:disable:no-console
import * as _ from 'lodash';
import { action, observable } from 'mobx';
import { noop } from '../utilities/helpers';
import { MainStore } from './mainStore';

/**
 * This class wraps all common store functions with success/error popups.
 * The desired methods that start with "do" should be overridden in the specific stores.
 */
export class DomainStore<SingleType, OverviewType = SingleType> {
  protected get entityName() {
    return {
      singular: this.mainStore.intl.formatMessage({
        id: 'store.domainStore.entity.one',
        defaultMessage: 'Die Entität',
      }),
      plural: this.mainStore.intl.formatMessage({
        id: 'store.domainStore.entity.other',
        defaultMessage: 'Die Entitäten',
      }),
    };
  }

  get entity(): SingleType | undefined {
    throw new Error('Not implemented');
  }

  set entity(e: SingleType | undefined) {
    throw new Error('Not implemented');
  }

  get entities(): OverviewType[] {
    throw new Error('Not implemented');
  }

  set entities(entities: OverviewType[]) {
    throw new Error('Not implemented');
  }

  static buildErrorMessage(e: { messages: any }, defaultMessage: string) {
    if ('messages' in e && typeof e.messages === 'object') {
      return this.buildServerErrorMessage(e, defaultMessage);
    }

    return defaultMessage;
  }

  private static buildServerErrorMessage(e: { messages: any }, defaultMessage: string) {
    if ('error' in e.messages) {
      return `${defaultMessage}: ${e.messages.error}`;
    } else if ('human_readable_descriptions' in e.messages) {
      return this.buildErrorList(e.messages.human_readable_descriptions, defaultMessage);
    } else if ('errors' in e.messages) {
      return this.buildMiscErrorListMessage(e, defaultMessage);
    }

    return defaultMessage;
  }

  private static buildMiscErrorListMessage(e: { messages: any }, defaultMessage: string) {
    if (typeof e.messages.errors === 'string') {
      return `${defaultMessage}: ${e.messages.errors}`;
    } else if (typeof e.messages.errors === 'object') {
      const errors: { [index: string]: string } = e.messages.errors;
      return this.buildErrorList(_.map(errors, (value, key) => this.humanize(key, value)), defaultMessage);
    } else {
      return defaultMessage;
    }
  }

  private static buildErrorList(messages: string[], defaultMessage: string) {
    const errorMessageTemplate = `
              <ul class="mt-1 mb-0">
                <% _.forEach(messages, message => {%>
                    <li><%- message %></li>
                <%});%>
              </ul>
            `;

    return `${defaultMessage}:` + _.template(errorMessageTemplate)({ messages });
  }

  private static humanize(key: string, errors: string[] | string) {
    const description = Array.isArray(errors) ? errors.join(', ') : errors;
    return _.capitalize(_.lowerCase(key)) + ' ' + description;
  }

  @observable
  filteredEntities: OverviewType[] = [];

  filter: () => void = noop;

  protected entitiesURL?: string = '';
  protected entityURL?: string = '';

  constructor(protected mainStore: MainStore) { }

  @action
  async fetchAll(params: object = {}) {
    try {
      await this.doFetchAll(params);
    } catch (e) {
      this.mainStore.displayError(
        DomainStore.buildErrorMessage(e, this.mainStore.intl.formatMessage(
          {
            id: 'store.domainStore.not_loaded.other',
            defaultMessage: '{entityNamePlural} konnten nicht geladen werden.',
          },
          { entityNamePlural: this.entityName.plural },
        )));
      console.error(e);
      throw e;
    }
  }

  @action
  async fetchOne(id: number) {
    try {
      this.entity = undefined;
      return await this.doFetchOne(id);
    } catch (e) {
      this.mainStore.displayError(
        DomainStore.buildErrorMessage(e, this.mainStore.intl.formatMessage(
          {
            id: 'store.domainStore.not_loaded.one',
            defaultMessage: '{entityNameSingular} konnte nicht geladen werden',
          },
          { entityNameSingular: this.entityName.singular },
        )));
      console.error(e);
      throw e;
    }
  }

  @action
  async post(entity: SingleType) {
    await this.displayLoading(async () => {
      try {
        await this.doPost(entity);
        this.mainStore.displaySuccess(this.mainStore.intl.formatMessage(
          {
            id: 'store.domainStore.saved.one',
            defaultMessage: '{entityNameSingular} wurde gespeichert',
          },
          { entityNameSingular: this.entityName.singular },
        ));
      } catch (e) {
        this.mainStore.displayError(
          DomainStore.buildErrorMessage(e, this.mainStore.intl.formatMessage(
            {
              id: 'store.domainStore.not_saved.one',
              defaultMessage: '{entityNameSingular} konnte nicht gespeichert werden',
            },
            { entityNameSingular: this.entityName.singular },
          )));
        throw e;
      }
    });
  }

  @action
  async put(entity: SingleType) {
    await this.displayLoading(async () => {
      try {
        await this.doPut(entity);
        this.mainStore.displaySuccess(this.mainStore.intl.formatMessage(
          {
            id: 'store.domainStore.saved.one',
            defaultMessage: '{entityNameSingular} wurde gespeichert',
          },
          { entityNameSingular: this.entityName.singular },
        ));
      } catch (e) {
        this.mainStore.displayError(
          DomainStore.buildErrorMessage(e, this.mainStore.intl.formatMessage(
            {
              id: 'store.domainStore.not_saved.one',
              defaultMessage: '{entityNameSingular} konnte nicht gespeichert werden',
            },
            { entityNameSingular: this.entityName.singular },
          )));
        console.error(e);
        throw e;
      }
    });
  }

  @action
  async delete(id: number | string) {
    await this.displayLoading(async () => {
      try {
        await this.doDelete(id);
        this.mainStore.displaySuccess(this.mainStore.intl.formatMessage(
          {
            id: 'store.domainStore.deleted.one',
            defaultMessage: '{entityNameSingular} wurde gelöscht.',
          },
          { entityNameSingular: this.entityName.singular },
        ));
      } catch (e) {
        this.mainStore.displayError(
          DomainStore.buildErrorMessage(e, this.mainStore.intl.formatMessage(
            {
              id: 'store.domainStore.not_deleted.one',
              defaultMessage: '{entityNameSingular} konnte nicht gelöscht werden',
            },
            { entityNameSingular: this.entityName.singular },
          )));
        console.error(e);
        throw e;
      }
    });
  }

  async displayLoading<P>(f: () => Promise<P>) {
    // TODO: trigger loading indicator in MainStore
    await f();
  }

  async notifyProgress<P>(f: () => Promise<P>, {
    errorMessage = this.mainStore.intl.formatMessage({
      id: 'store.domainStore.error',
      defaultMessage: 'Fehler!',
    }),
    successMessage = this.mainStore.intl.formatMessage({
      id: 'store.domainStore.success',
      defaultMessage: 'Erfolg!',
    }),
  } = {}) {
    await this.displayLoading(async () => {
      try {
        await f();
        if (successMessage) {
          this.mainStore.displaySuccess(successMessage);
        }
      } catch (e) {
        if (successMessage) {
          this.mainStore.displayError(errorMessage);
        }
        console.error(e);
        throw e;
      }
    });
  }

  @action
  protected async doFetchAll(params: object = {}) {
    if (!this.entitiesURL) {
      throw new Error('Not implemented');
    }

    const res = await this.mainStore.api.get<OverviewType[]>(this.entitiesURL);
    this.entities = res.data;
  }

  @action
  protected async doFetchOne(id: number): Promise<SingleType | void> {
    if (!this.entityURL) {
      throw new Error('Not implemented');
    }

    const res = await this.mainStore.api.get<SingleType>(this.entityURL + id);
    this.entity = res.data;
  }

  @action
  protected async doPost(entity: SingleType) {
    if (!this.entitiesURL) {
      throw new Error('Not implemented');
    }

    const response = await this.mainStore.api.post<OverviewType>(this.entitiesURL, entity);
    this.entities.push(response.data);
  }

  @action
  protected async doPut(entity: SingleType) {
    if (!this.entityURL || !('id' in entity)) {
      throw new Error('Not implemented');
    }

    const entityWithId = entity as SingleType & { id: any };

    const response = await this.mainStore.api.put<SingleType>(this.entitiesURL + entityWithId.id, entity);
    this.entity = response.data;

    if (this.entities.length > 0) {
      this.entities.findIndex(value => (value as any).id === entityWithId.id);
    }
  }

  @action
  protected async doDelete(id: number | string) {
    if (!this.entityURL) {
      throw new Error('Not implemented');
    }

    await this.mainStore.api.delete(this.entityURL + id);

    if (this.entities && this.entities.length > 0 && 'id' in this.entities[0]) {
      this.entities = _.reject(this.entities, entity => (entity as OverviewType & { id: number }).id === id);
    }

    await this.filter();
  }
}
