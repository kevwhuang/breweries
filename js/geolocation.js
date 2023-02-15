const locator = {
  coords: [],
  errorCodes: {
    UNKNOWN: "gps-unknown-error",
    BROWSER_UNSUPPORTED_CLASS: "gps-unsupported-error",
    CONNECTION_CLASS: "gps-connection-error",
    PERMISSION_DENIED_CLASS: "gps-permission-error",
  },
  /**
   * Getter for coordinates already-fetched during canGeolocate
   * @returns {Array} formatted coords
   */
  getCoords: function () {
    return locator.coords.map(formatCoord);
  },
  /**
   * Checks that browser supports geolocation, geolocation is permited, and other errors in acquisition
   * @throws { Error } error encountered when determining location, be it native from the browser's issue (no support) or denial from the user during perm check
   * @returns { Boolean } If user accepted, returns Promise that resolved to true
   */
  canGeolocate: async function () {
    if (!navigator.geolocation)
      throw new Error(locator.BROWSER_UNSUPPORTED_CLASS);

    return new Promise((resolve, reject) => {
      function success(pos) {
        locator.coords = [pos.coords.latitude, pos.coords.longitude];
        resolve(true);
      }

      function error(err) {
        if (!navigator.onLine) reject(new Error(locator.CONNECTION_CLASS));
        else if (err.PERMISSION_DENIED)
          reject(new Error(locator.PERMISSION_DENIED_CLASS));
      }

      navigator.geolocation.getCurrentPosition(success, error);
      navigator.geolocation.watchPosition(success, error);
    });
  },
};

// Truncate to 5 floating point chars and pad w + if needed
function formatCoord(coord) {
  let formatted = coord.toFixed(5);
  return !formatted.startsWith("-") ? `+${formatted}` : formatted;
}
