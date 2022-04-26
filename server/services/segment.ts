import Analytics from 'analytics-node';
const analytics = new Analytics('pkG5P17lwtHkBOY1b8svfKfyRmPctvER');

type Properties = {
  [key: string]: string | number | boolean | Date | string[]
}

const runIfProduction = (func) => {
  if (process.env.NODE_ENV === 'production') {
    func();
  }
}

/**
* Send a "user identified" event to Segment.
* @param {string} userId - The user's unique ID.
* @param {typereference} traits - Properties
* @returns None
*/
export const identify = (userId: string, traits?: Properties) => {
  runIfProduction(() => {
    analytics.identify({
      userId,
      traits,
    });
  })
}

/**
* If we're in production,
* send the event to Segment.
* @param {string} userId - The user ID you want to associate with the event.
* @param {string} event - The name of the event you're tracking.
* @param {typereference} properties - Any properties
*/
export const track = (userId: string, event: string, properties?: Properties) => {
  runIfProduction(() => {
    analytics.track({
      userId,
      event,
      properties
    });
  })
}

export const trackOpen = (fields: any) => {
  runIfProduction(() => {
    analytics.track(fields);
  });
}