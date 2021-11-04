'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.SimulateService = void 0;
const lodash_1 = require('lodash');
const repository_1 = require('../core/repository');
const Bluebird = require('bluebird');
class SimulateService extends repository_1.Repository {
  get preLoginFlowRequests() {
    return [
      () => this.client.account.readMsisdnHeader(),
      () => this.client.account.msisdnHeaderBootstrap('ig_select_app'),
      () => this.client.zr.tokenResult(),
      () => this.client.account.contactPointPrefill('prefill').catch(() => undefined),
      () => this.client.launcher.preLoginSync(),
      () => this.client.qe.syncLoginExperiments(),
      () => this.client.attribution.logAttribution(),
      () => this.client.account.getPrefillCandidates().catch(() => undefined),
    ];
  }
  get postLoginFlowRequests() {
    return [
      () => this.client.zr.tokenResult(),
      () => this.client.launcher.postLoginSync(),
      () => this.client.qe.syncExperiments(),
      () => this.client.attribution.logAttribution(),
      () => this.client.attribution.logResurrectAttribution(),
      () => this.client.loom.fetchConfig(),
      () => this.client.linkedAccount.getLinkageStatus(),
      () => this.client.feed.timeline().request({ recoveredFromCrash: '1', reason: 'cold_start_fetch' }),
      () => this.client.fbsearch.suggestedSearches('users'),
      () => this.client.fbsearch.suggestedSearches('blended'),
      () => this.client.fbsearch.recentSearches(),
      () => this.client.direct.rankedRecipients('reshare'),
      () => this.client.direct.rankedRecipients('raven'),
      () => this.client.direct.getPresence(),
      () => this.client.feed.directInbox().request(),
      () => this.client.media.blocked(),
      () => this.client.qp.batchFetch(),
      () => this.client.qp.getCooldowns(),
      () => this.client.user.arlinkDownloadInfo(),
      () => this.client.discover.topicalExplore(),
      () => this.client.discover.markSuSeen(),
      () => this.facebookOta(),
      () => this.client.status.getViewableStatuses(),
    ];
  }
  static async executeRequestsFlow({ requests, concurrency = 1, toShuffle = true }) {
    if (toShuffle) {
      requests = lodash_1.shuffle(requests);
    }
    await Bluebird.map(requests, request => request(), { concurrency });
  }
  async preLoginFlow(concurrency, toShuffle) {
    return SimulateService.executeRequestsFlow({
      requests: this.preLoginFlowRequests,
      concurrency,
      toShuffle,
    });
  }
  async postLoginFlow(concurrency, toShuffle) {
    return SimulateService.executeRequestsFlow({
      requests: this.postLoginFlowRequests,
      concurrency,
      toShuffle,
    });
  }
  async facebookOta() {
    const uid = this.client.state.cookieUserId;
    const { body } = await this.client.request.send({
      url: '/api/v1/facebook_ota/',
      qs: {
        fields: this.client.state.fbOtaFields,
        custom_user_id: uid,
        signed_body: this.client.request.signature('') + '.',
        ig_sig_key_version: this.client.state.signatureVersion,
        version_code: this.client.state.appVersionCode,
        version_name: this.client.state.appVersion,
        custom_app_id: this.client.state.fbOrcaApplicationId,
        custom_device_id: this.client.state.uuid,
      },
    });
    return body;
  }
}
exports.SimulateService = SimulateService;
//# sourceMappingURL=simulate.service.js.map
