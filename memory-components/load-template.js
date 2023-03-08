customElements.define(
  "load-template",
  class extends HTMLElement {
    async connectedCallback(
      src = this.getAttribute("src"), //
      nodeName = this.getAttribute("into"),
      isUpperCase = (nodeName == nodeName.toUpperCase()|| console.error("into attribute must be UPPERCASE name", nodeName)),
      name = nodeName.toLowerCase() + "-html",
      //isCustomElement = (customElements.get(nodeName.toLowerCase()) || console.error("No custom element", nodeName))
    ) {
      let file = await fetch(src);
      if (file.status == 200) {
        let html = await file.text();
        this.attachShadow({ mode: "open" }).innerHTML = html;
        this.shadowRoot.firstElementChild.id = nodeName;
        this.replaceWith(...this.shadowRoot.childNodes);
        this.dispatchEvent(new CustomEvent(this.nodeName, { detail: this }));
        // DEFINE A CUSTOM ELEMENT SO OTHER ELEMENTS CAN WAIT FOR THE LOADED TEMPLATE
        setTimeout(() => {
          // MAKE SURE <TEMPLATE> IS PARSED
          customElements.define(
            name,
            class extends HTMLElement {
              get html() {
                return html;
              }
            }
          );
        }, 10);
      } else {
        console.error("No template file:", src);
      }
    }
  }
);
