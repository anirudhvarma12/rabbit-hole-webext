interface NavigationDetail {
  tabId: number;
  url: string;
  processId?: number;
  frameId: number;
  transitionType?: browser.webNavigation.TransitionType;
  transitionQualifiers?: browser.webNavigation.TransitionQualifier[];
  timeStamp: number;
}

function onDomLoaded(details: NavigationDetail) {
  console.log(details);
}

const filter: browser.webNavigation.EventUrlFilters = { url: [{ hostContains: ".wikipedia" }] };
console.log("Loaded Script");
browser.webNavigation.onCommitted.addListener(onDomLoaded, filter);
