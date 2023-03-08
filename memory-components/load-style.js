customElements.define(
  "load-style",
  class extends HTMLElement {
    async connectedCallback(
      src = this.getAttribute("src") //
    ) {
      let host = this.getRootNode().host;
      let id = src.split("/").slice(-2, -1).join("/") + ".css";
      let el = document.getElementById(id);
      if (el) {
        host.shadowRoot.append(el.content.cloneNode(true));
      } else {
        console.log(host.nodeName, id, document.getElementById(id));
        let file = await fetch(src);
        if (file.status == 200) {
          let css = await file.text();
          this.append(
            Object.assign((this.style = document.createElement("style")), {
              innerHTML: css, //*css*/
              onload: () => {
                host.$executeMethod("$styleLoaded", this.style);
              },
            })
          );
        } else {
          console.error("No CSS file:", src);
        }
      }
    }
  }
);
