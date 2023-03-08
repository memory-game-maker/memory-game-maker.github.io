class RoadsTechnologyBaseClass extends HTMLElement {
  $getURLParameter(name) {
    return new URLSearchParams(document.location.search).get(name);
  }
  // ============================================================== $executeMethod
  get eventbus() {
    return document;
  }
  // ============================================================== $executeMethod
  $executeMethod(method, ...args) {
    if (this[method]) {
      this[method](...args);
    } else {
      let bg = "background:orange";
      if (this.debug)
        console.log(
          `%c No method %c "${method}" %c in: `,
          bg,
          "background:yellow",
          bg,
          this.localName
        );
    }
  }
  // ==============================================================
  // SELECTORS
  // ==============================================================
  $getPart(name) {
    return this.shadowRoot.querySelector(`[part="${name}"]`);
  }
  $getLightDOM(selector) {
    return this.querySelector(selector);
  }
  $closestElement(selector, el = this) {
    return (
      (el && el != document && el != window && el.closest(selector)) ||
      this.$closestElement(selector, el.getRootNode().host)
    );
  }
  // ==============================================================
  // DOM ELEMENTS START
  // ==============================================================
  // ============================================================== setCSSProperty
  $setCSSProperty(name, value = "initial", el = this) {
    el.style.setProperty(`--${el.localName}-${name}`, value);
  }
  $getCSSProperty(name, el = this) {
    getComputedStyle(el).getPropertyValue(`--${el.localName}-${name}`).trim();
  }
  // ============================================================== cloneTemplate
  $cloneTemplate(id) {
    // ------------------------------------------------------ read <template id="id">
    let template = document.getElementById(id);
    if (template) {
      // ------------------------------------------------------ if found, clone it
      this.consolelog("Cloned template", id);
      return template.content.cloneNode(true);
    } else {
      // ------------------------------------------------------ if NOT found, log it
      console.error("template not found", id);
      // !! return default content
    }
  }
  // ============================================================== createElement
  $createElement({
    tag = "div", // HTML tag name "div", if start with * or ** call $query to get element
    props = {}, // properties (and eventlisteners) attached to element
    attrs = [], // attributes attached to element
    classes = [],
    events = {}, // standard eventlisteners attached to element
    listeners = {}, // custom eventlisteners attached to element, when added to the DOM
    customevents = {}, // custom eventlisteners attached to element
    prepend = [], // element.prepend(...prepend)
    html, // element.innerHTML
    append = [], // element.append(...append)
    // optional override new element with existing element
    element = tag.charAt(0) === "*"
      ? this.$query(tag) // do not create a new tag, find existing element
      : document.createElement(tag), // else create a new tag
    styles = {},
    //stuff any other properties into moreprops variable
    ...moreprops
  }) {
    // assign props,events and moreprops to element
    element = Object.assign(element, { ...props, ...events, ...moreprops });
    // filter out empty classes
    classes = classes.filter((x) => x.length);
    if (classes.length) element.classList.add(...classes);

    element.prepend(...prepend.filter(Boolean));
    if (html) element.innerHTML = html;
    element.append(...append.filter(Boolean));

    (Array.isArray(attrs)
      ? attrs // if attrs is an Array, do a setAttribute for each attribute
      : Object.entries(attrs)
    ) // else proces as Object
      .map(([key, value]) => element.setAttribute(key, value));

    // apply styles
    Object.entries(styles).map(([key, value]) => {
      element.style[key] = value;
    });
    // apply customevents
    Object.entries(customevents).map(([name, handler]) => {
      console.log(name, handler, this);
      this.$listen({
        name,
        handler: handler.bind(element), // bind element scope to handler
        eventbus: document,
      });
    });

    // add listener to remove all eventlisteners on element
    element.addEventListener(new CustomEvent("removeEventListeners"), (evt) => {
      element.removeEventListeners(evt);
    });
    return element;
  }
  // ==============================================================
  // DOM ELEMENTS END
  // ==============================================================
  // ==============================================================
  // EVENTLISTENERS START
  // ==============================================================
  // ======================================================== $dispatch
  $dispatch({
    name, // EventName
    detail = {}, // event.detail
    // override options PER option:
    bubbles = true, // default, bubbles up the DOM
    composed = true, // default, escape shadowRoots
    cancelable = true, // default, cancelable event bubbling
    // optional overwrite whole options settings, or use already specified options
    options = {
      bubbles,
      composed,
      cancelable,
    },
    eventbus = this, // default dispatch from current this element or use something like eventbus:document
    once = false, // default .dispatchEvent option to execute a Listener once
  }) {
    //console.warn("%c EventName:", "background:yellow", name, [detail]);
    eventbus.dispatchEvent(
      new CustomEvent(name, {
        ...options, //
        detail,
      }),
      once // default false
    );
  }
  // ======================================================== $emit
  // shorthand code for $dispatch({})
  $emit(name, detail = {}, root = this) {
    root.$dispatch({
      name, // eventName
      detail: {
        ...detail,
      }, // evt.detail
    });
  }
  // ======================================================== $listen
  $listen({
    name = this.nodeName, // first element is String or configuration Object{}
    handler = (evt) => {
      console.error(evt.type);
    }, // optional handler FUNCTION, default empty function
    eventbus = this, // at what element in the DOM the listener should be attached
    useCapture = false, // optional, default false
  }) {
    eventbus.addEventListener(
      name,
      (evt) => handler(evt),
      useCapture // default false
    );
    // record all listeners on this element
    this._listeners = this._listeners || [];
    this._listeners.push(() => eventbus.$removeEventListener(name, handler));
  }
  // ======================================================== $removeEventListeners
  $removeEventListeners() {
    this._listeners.map((x) => x());
  }
  // ==============================================================
  // EVENTLISTENERS END
  // ==============================================================
  $$style(style) {
    //console.warn("styleLoaded", style);
    this.$executeMethod("$styleLoaded", style);
  }
  // ==============================================================
  // EVENTLISTENERS - $registerEventMethods
  // ==============================================================
  $registerEventMethod({
    scope = this,
    methodName = console.error("Missing methodeName", scope),
  }) {
    let eventbus;
    let [event, ...name] = methodName.split("_"); //! name becomes an Array!
    event = event.replace("$", "");
    //! determine name and eventbus where to listen
    name = name.join("_"); // make sure second _ in event_nameX_nameY is possible
    if (event === "eventbus") {
      // event_nameX_nameY is registered on document
      eventbus = scope.eventbus; // listening at document level
    } else if (event == "serverevent") {
      // todo Add SSE support
    } else {
      // $click is registered on scope/this element
      eventbus = scope; // listening at current element level
    }
    let useCapture = name.includes("_capture"); // todo document this
    if (useCapture) name = name.replace("_capture", "");
    // register the listener
    try {
      scope.$listen({
        name, // eventName
        eventbus, // at which DOM level the event is listening
        handler: (evt) => {
          console.log(
            `%c ${eventbus.localName} %c ${evt.type}`,
            "background:blue;color:yellow",
            "background:gold",
            { evt }
          );
          scope[methodName].call(scope, evt); // call the handler with correct scope (this
          //scope[methodName].bind(scope); // reference to the handler with correct scope
        },
        useCapture,
      });
    } catch (error) {
      console.error(error.message, { scope, methodName });
    }
    return `${event}:${name}`;
  }
  $registerEventMethods({ scope }) {
    let handlerNames = Object.getOwnPropertyNames(Object.getPrototypeOf(scope))
      .filter(
        (methodName) =>
          methodName.startsWith("$") && methodName.includes("event")
      )
      .map((methodName) => this.$registerEventMethod({ scope, methodName }))
      .filter(Boolean); // getOwnPropertyNames
    if (handlerNames.length)
      this.consolelog(
        scope.nodeName,
        "registerEvents:",
        handlerNames.join(", ")
      );
  } // $registerEventMethods
} // class RoadsTechnologyBaseClass

// ****************************************************************** define <memory-game-baseclass>
// Roads Technology Authors: Danny, Erin, Willem
customElements.define(
  "memory-game-baseclass",
  class extends RoadsTechnologyBaseClass {
    consolelog(...args) {
      console.log("%c RTMgame ", "background:gold", ...args);
    }

    // ============================================================== constructor
    get MemoryGameElement() {
      return this.$closestElement("memory-game");
    }
    // ============================================================== constructor
    constructor() {
      // execute constructor for all derived components
      super() //
        .attachShadow({ mode: "open" }) //
        .append(this.$cloneTemplate(this.nodeName)); //
    }
    // ============================================================== connectedCallback
    $injectTemplatesIntoComponent(
      {
        // default values for parameters in Object
        destination = this,
        templateSelector = `template[into="${this.nodeName}"]`,
      } = {
        // default Object when no parameter is passed
        templateSelector: `template[into="${this.nodeName}"]`,
        destination: this,
      }
    ) {
      if (destination.shadowRoot) {
        document
          .querySelectorAll(templateSelector)
          .forEach((tmpl) =>
            destination.shadowRoot.append(tmpl.content.cloneNode(true))
          );
      } else {
        console.warn("No shadowRoot in:", destination);
      }
    }
    connectedCallback() {
      this.$registerEventMethods({ scope: this }); //! register all methods starting with event_ as $listener
      this.$executeMethod("$connectedComponent");
      setTimeout(() => {
        this.$injectTemplatesIntoComponent();
        this.$executeMethod("$renderedComponent");
      });
    }
    // ==============================================================
    // TEXTFIT
    // ==============================================================
    $fitTextInContainer(textspan, container) {
      let fontSize = textspan.offsetWidth;
      while (textspan.offsetWidth < container.offsetWidth) {
        fontSize++;
        textspan.style.fontSize = fontSize + "px";
      }
    }
  }
);
