/**
 * Pulse Analytics - Client-Side Event Tracker
 *
 * Embeddable tracking script that records page_view and click events.
 *
 * Usage:
 * <script src="http://localhost:5173/tracker.js" data-api-url="http://localhost:5000/api" defer></script>
 *
 * Coordinate System:
 * - Click coordinates are recorded relative to the document (pageX, pageY).
 * - Viewport dimensions (window.innerWidth, window.innerHeight) are stored alongside
 *   each click event so coordinates can be normalized during heatmap rendering.
 *
 * Session Management:
 * - A unique session ID is generated using crypto.randomUUID() (with fallback).
 * - Stored in sessionStorage ('pulse_session_id'), so it persists across page navigations
 *   within the same browsing tab/session.
 * - A new session starts when the tab is closed and reopened.
 *
 * Event Transmission:
 * - Events are batched and sent periodically (every 2 seconds) or when 10 events accumulate.
 * - navigator.sendBeacon is used on page unload to flush remaining events.
 * - Non-blocking asynchronous XHR/fetch with comprehensive error handling to avoid
 *   impacting host website performance.
 */
(function () {
  'use strict';

  // Prevent double initialization
  if (window.__pulseTrackerInitialized) return;
  window.__pulseTrackerInitialized = true;

  // --- Configuration ---
  var scriptTag = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('tracker.js') !== -1) {
        return scripts[i];
      }
    }
    return null;
  })();

  var API_URL = (scriptTag && scriptTag.getAttribute('data-api-url')) || 'http://localhost:5000/api';
  var DEBUG = (scriptTag && scriptTag.getAttribute('data-debug') === 'true') || false;

  function log() {
    if (DEBUG) {
      console.log.apply(console, ['[Pulse Tracker]'].concat(Array.prototype.slice.call(arguments)));
    }
  }

  // --- Session Management ---
  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getSessionId() {
    var SESSION_KEY = 'pulse_session_id';
    var id = null;
    try {
      id = sessionStorage.getItem(SESSION_KEY);
    } catch (_e) {
      // sessionStorage not available
    }
    if (!id) {
      id = generateId();
      try {
        sessionStorage.setItem(SESSION_KEY, id);
      } catch (_e) {
        // Silently fail
      }
    }
    return id;
  }

  var sessionId = getSessionId();
  log('Session ID:', sessionId);

  // --- Event Queue & Transmission ---
  var eventQueue = [];
  var BATCH_SIZE = 10;
  var FLUSH_INTERVAL = 2000; // 2 seconds
  var totalSentCount = 0;

  function createEvent(type, extra) {
    var event = {
      session_id: sessionId,
      event_type: type,
      page_url: (extra && extra.page_url) || window.location.href,
      timestamp: new Date().toISOString(),
    };
    if (extra) {
      for (var key in extra) {
        if (extra.hasOwnProperty(key) && key !== 'page_url') {
          event[key] = extra[key];
        }
      }
    }
    return event;
  }

  function queueEvent(event) {
    eventQueue.push(event);
    log('Queued event:', event.event_type, '(queue size: ' + eventQueue.length + ')');
    if (eventQueue.length >= BATCH_SIZE) {
      flush();
    }
  }

  function flush() {
    if (eventQueue.length === 0) return;

    var eventsToSend = eventQueue.splice(0, eventQueue.length);
    log('Flushing', eventsToSend.length, 'events');

    eventsToSend.forEach(function (event) {
      sendEvent(event);
    });
  }

  function sendEvent(event) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', API_URL + '/events', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            totalSentCount++;
            log('Event sent successfully:', event.event_type, 'Total sent:', totalSentCount);
          } else {
            log('Failed to send event:', xhr.status, xhr.responseText);
          }
        }
      };
      xhr.onerror = function () {
        log('Network error sending event (handled gracefully)');
      };
      xhr.send(JSON.stringify(event));
    } catch (e) {
      log('Error sending event:', e);
    }
  }

  // Periodic flush timer
  setInterval(flush, FLUSH_INTERVAL);

  // Flush on page unload using sendBeacon or sync XHR fallback
  function flushOnUnload() {
    if (eventQueue.length === 0) return;

    var eventsToSend = eventQueue.splice(0, eventQueue.length);
    eventsToSend.forEach(function (event) {
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            API_URL + '/events',
            new Blob([JSON.stringify(event)], { type: 'application/json' })
          );
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('POST', API_URL + '/events', false);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(JSON.stringify(event));
        }
      } catch (_e) {
        // Silently fail on unload
      }
    });
  }

  window.addEventListener('beforeunload', flushOnUnload);
  window.addEventListener('unload', flushOnUnload);

  // --- Filtering & Rules ---
  function isDashboardPage() {
    var path = window.location.pathname;
    return (
      path === '/' ||
      path === '/sessions' ||
      path === '/heatmap' ||
      path.indexOf('/sessions/') === 0
    );
  }

  // --- Page View Tracking ---
  function trackPageView(customUrl) {
    var url = customUrl || window.location.href;
    var event = createEvent('page_view', { page_url: url });
    queueEvent(event);
  }

  // Record initial page view if on tracked page
  if (!isDashboardPage()) {
    trackPageView();
  }

  // SPA navigation handling (popstate, pushState, replaceState)
  var currentTrackedUrl = window.location.href;
  function handleUrlChange() {
    var newUrl = window.location.href;
    if (newUrl !== currentTrackedUrl) {
      currentTrackedUrl = newUrl;
      if (!isDashboardPage()) {
        log('SPA navigation detected:', newUrl);
        trackPageView(newUrl);
      }
    }
  }

  var originalPushState = history.pushState;
  if (originalPushState) {
    history.pushState = function () {
      originalPushState.apply(this, arguments);
      handleUrlChange();
    };
  }

  var originalReplaceState = history.replaceState;
  if (originalReplaceState) {
    history.replaceState = function () {
      originalReplaceState.apply(this, arguments);
      handleUrlChange();
    };
  }

  window.addEventListener('popstate', handleUrlChange);

  // --- Click Tracking ---
  function handleClick(e) {
    // Never track clicks on the analytics dashboard itself
    if (isDashboardPage()) return;

    var event = createEvent('click', {
      coordinates: {
        x: Math.round(e.pageX),
        y: Math.round(e.pageY),
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });
    queueEvent(event);
  }

  document.addEventListener('click', handleClick, true);

  // --- Public API for Demo and Integrations ---
  window.PulseTracker = {
    version: '1.0.0',
    getSessionId: function () {
      return sessionId;
    },
    trackPageView: function (url) {
      trackPageView(url);
    },
    trackClick: function (x, y, extra) {
      var event = createEvent('click', {
        coordinates: {
          x: Math.round(x),
          y: Math.round(y),
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        is_demo: extra ? extra.is_demo : false,
      });
      queueEvent(event);
    },
    flush: function () {
      flush();
    },
    getQueueLength: function () {
      return eventQueue.length;
    },
    getTotalSent: function () {
      return totalSentCount;
    },
  };

  log('Tracker initialized. Session:', sessionId, 'API:', API_URL);
})();
