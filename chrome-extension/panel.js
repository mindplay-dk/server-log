import { renderLog } from "./log.js";
/**
 * This custom element allows us to isolate server-side log pages in a shadow-root.
 */
class LogEntry extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }
    setHTML(html) {
        let doc = new DOMParser().parseFromString(html, "text/html");
        this.style.display = "block";
        [...doc.head.querySelectorAll("style")].forEach(style => this.shadow.appendChild(style));
        [...doc.body.childNodes].forEach(node => this.shadow.appendChild(node));
    }
}
customElements.define("log-entry", LogEntry);
((panel) => {
    console.log("START: panel.js");
    const $content = document.body.querySelector("[data-content]");
    panel.onNavigation = url => {
        console.log("ON NAVIGATION", url);
        // TODO add "Preserve Log" option (similar to the "Network" tab)
        $content.innerHTML = "";
    };
    panel.onRequest = transaction => {
        console.log("ON REQUEST", transaction);
        // NOTE: weird typecasts required here because the request/response properties
        //       aren't defined in `@types/chrome` - we have to pull these definitions
        //       from a separate package `@types/har-format` and manually cast:
        const request = transaction.request;
        const response = transaction.response;
        const title = `[${response.status} ${response.statusText}] ${request.method} ${request.url}`;
        for (let header of response.headers) {
            const name = header.name.toLowerCase();
            if (name === "x-chromelogger-data") {
                appendLog(title, "X-ChromeLogger-Data", new Promise((resolve, reject) => {
                    try {
                        const log = JSON.parse(atob(header.value));
                        console.log("PARSED CHROME-LOGGER HEADER", log);
                        resolve(renderLog(log));
                    }
                    catch (error) {
                        reject(`Error parsing X-ChromeLogger-Data header (${error})`);
                    }
                }));
            }
            if (name === "x-serverlog-location") {
                header.value.split(",").map(value => value.trim()).forEach(value => {
                    const url = new URL(value, request.url).href;
                    appendLog(title, url, new Promise((resolve, reject) => {
                        fetch(url, {
                            headers: new Headers({
                                "Accept": "text/html, application/json"
                            })
                        }).then(log_response => {
                            let type = log_response.headers.get("Content-Type");
                            if ((type && type.match(/^text\/html/) || (!type && url.match(/\.html$/)))) {
                                console.log("FETCH HTML");
                                resolve(log_response.text());
                            }
                            else {
                                console.log("FETCH JSON");
                                resolve(log_response.json().then(json => renderLog(json)));
                            }
                        }).catch(error => {
                            reject(`Unable to load server-log from: ${url} (${error})`);
                        });
                    }));
                });
            }
        }
    };
    /**
     * Append a log document to the "Server Log" panel
     */
    function appendLog(title, source, documentPromise) {
        const header = appendHeader("spinner", title, source);
        const el = document.createElement("log-entry");
        $content.appendChild(el);
        documentPromise
            .then(html => {
            el.setHTML(html);
            header.setIcon("check");
        })
            .catch(error => {
            el.setHTML(`<pre style="color:red; padding-left:20px;">${html(error)}</pre>`);
            header.setIcon("error");
        });
    }
    /**
     * Create a header with an icon, title and source of the request
     */
    function appendHeader(icon, title, source) {
        const el = document.createElement("div");
        el.innerHTML = (`
            <div class="header ${icon ? `header--${icon}` : ``}">
                <div class="header__icon">${icon ? `<span class="icon"></span>` : ``}</div>
                <div class="header__title">${html(title)}</div>
                <div class="header__source">${html(source)}</div>
            </div>`);
        $content.appendChild(el);
        function setIcon(icon) {
            el.querySelector(".icon").className = `icon icon-${icon}`;
        }
        ;
        setIcon(icon);
        return {
            setIcon
        };
    }
    /**
     * Escape plain text as HTML
     */
    function html(str) {
        return (str || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
})(window);
/*

// NOTE: don't need this for now - might need it to communicate with "background.js"

panel_window.do_something = (msg: string) => {
    console.log("DOING SOMETHING");
    document.body.textContent += '\n' + msg; // Stupid example, PoC
}

document.documentElement.onclick = function() {
    // No need to check for the existence of `respond`, because
    // the panel can only be clicked when it's visible...
    panel_window.respond('Another stupid example!');
};
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBTyxNQUFNLFVBQVUsQ0FBQztBQUsxQzs7R0FFRztBQUNILE1BQU0sUUFBUyxTQUFRLFdBQVc7SUFHOUI7UUFDSSxLQUFLLEVBQUUsQ0FBQztRQUVSLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCxPQUFPLENBQUMsSUFBWTtRQUNoQixJQUFJLEdBQUcsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFN0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBRTdCLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUMzQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFN0MsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUM1QixJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQztDQUNKO0FBRUQsY0FBYyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFFN0MsQ0FBQyxDQUFDLEtBQWtCLEVBQUUsRUFBRTtJQUVwQixPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFFL0IsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQWMsZ0JBQWdCLENBQUUsQ0FBQztJQUU3RSxLQUFLLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxFQUFFO1FBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRWxDLGdFQUFnRTtRQUNoRSxRQUFRLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztJQUM1QixDQUFDLENBQUM7SUFFRixLQUFLLENBQUMsU0FBUyxHQUFHLFdBQVcsQ0FBQyxFQUFFO1FBQzVCLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRXZDLDhFQUE4RTtRQUM5RSw4RUFBOEU7UUFDOUUsdUVBQXVFO1FBRXZFLE1BQU0sT0FBTyxHQUFJLFdBQW1CLENBQUMsT0FBa0IsQ0FBQztRQUN4RCxNQUFNLFFBQVEsR0FBSSxXQUFtQixDQUFDLFFBQW9CLENBQUM7UUFFM0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxRQUFRLENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQyxVQUFVLEtBQUssT0FBTyxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFN0YsS0FBSyxJQUFJLE1BQU0sSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFO1lBQ2pDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFdkMsSUFBSSxJQUFJLEtBQUsscUJBQXFCLEVBQUU7Z0JBQ2hDLFNBQVMsQ0FBQyxLQUFLLEVBQUUscUJBQXFCLEVBQUUsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQ3BFLElBQUk7d0JBQ0EsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBRTNDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLENBQUM7d0JBRWhELE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBVSxDQUFDLENBQUMsQ0FBQztxQkFDbEM7b0JBQUMsT0FBTyxLQUFLLEVBQUU7d0JBQ1osTUFBTSxDQUFDLDZDQUE2QyxLQUFLLEdBQUcsQ0FBQyxDQUFDO3FCQUNqRTtnQkFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ1A7WUFFRCxJQUFJLElBQUksS0FBSyxzQkFBc0IsRUFBRTtnQkFDakMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUMvRCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFFN0MsU0FBUyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7d0JBQ2xELEtBQUssQ0FBQyxHQUFHLEVBQUU7NEJBQ1AsT0FBTyxFQUFFLElBQUksT0FBTyxDQUFDO2dDQUNqQixRQUFRLEVBQUUsNkJBQTZCOzZCQUMxQyxDQUFDO3lCQUNMLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUU7NEJBQ25CLElBQUksSUFBSSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDOzRCQUVwRCxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQ0FDeEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQ0FDMUIsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDOzZCQUNoQztpQ0FBTTtnQ0FDSCxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dDQUMxQixPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7NkJBQzlEO3dCQUNMLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTs0QkFDYixNQUFNLENBQUMsbUNBQW1DLEdBQUcsS0FBSyxLQUFLLEdBQUcsQ0FBQyxDQUFDO3dCQUNoRSxDQUFDLENBQUMsQ0FBQztvQkFDUCxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNSLENBQUMsQ0FBQyxDQUFDO2FBQ047U0FDSjtJQUNMLENBQUMsQ0FBQTtJQUVEOztPQUVHO0lBQ0gsU0FBUyxTQUFTLENBQUMsS0FBYSxFQUFFLE1BQWMsRUFBRSxlQUFnQztRQUM5RSxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUV0RCxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBYSxDQUFDO1FBRTNELFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFekIsZUFBZTthQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNULEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFakIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDWCxFQUFFLENBQUMsT0FBTyxDQUFDLDhDQUE4QyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTlFLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTLFlBQVksQ0FBQyxJQUFVLEVBQUUsS0FBYSxFQUFFLE1BQWM7UUFDM0QsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUV6QyxFQUFFLENBQUMsU0FBUyxHQUFHLENBQUM7aUNBQ1MsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFOzRDQUUxQyxJQUFJLENBQUMsQ0FBQyxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQyxFQUMxQzs2Q0FDNkIsSUFBSSxDQUFDLEtBQUssQ0FBQzs4Q0FDVixJQUFJLENBQUMsTUFBTSxDQUFDO21CQUN2QyxDQUNWLENBQUM7UUFFRixRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXpCLFNBQVMsT0FBTyxDQUFDLElBQVU7WUFDdkIsRUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUUsQ0FBQyxTQUFTLEdBQUcsYUFBYSxJQUFJLEVBQUUsQ0FBQztRQUMvRCxDQUFDO1FBQUEsQ0FBQztRQUVGLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVkLE9BQU87WUFDSCxPQUFPO1NBQ1YsQ0FBQztJQUNOLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQVMsSUFBSSxDQUFDLEdBQThCO1FBQ3hDLE9BQU8sQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDO2FBQ2IsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUM7YUFDdEIsT0FBTyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUM7YUFDdkIsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUM7YUFDdEIsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7YUFDckIsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQixDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMsTUFBcUIsQ0FBQyxDQUFDO0FBRTFCOzs7Ozs7Ozs7Ozs7OztFQWNFIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVuZGVyTG9nLCBMb2cgfSBmcm9tIFwiLi9sb2cuanNcIjtcclxuaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tIFwiaGFyLWZvcm1hdFwiO1xyXG5cclxudHlwZSBJY29uID0gXCJzcGlubmVyXCIgfCBcImVycm9yXCIgfCBcImNoZWNrXCIgfCB1bmRlZmluZWQ7XHJcblxyXG4vKipcclxuICogVGhpcyBjdXN0b20gZWxlbWVudCBhbGxvd3MgdXMgdG8gaXNvbGF0ZSBzZXJ2ZXItc2lkZSBsb2cgcGFnZXMgaW4gYSBzaGFkb3ctcm9vdC5cclxuICovXHJcbmNsYXNzIExvZ0VudHJ5IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xyXG4gICAgcHJpdmF0ZSBzaGFkb3c6IFNoYWRvd1Jvb3Q7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5zaGFkb3cgPSB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwib3BlblwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEhUTUwoaHRtbDogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IGRvYyA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgXCJ0ZXh0L2h0bWxcIik7XHJcblxyXG4gICAgICAgIHRoaXMuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuXHJcbiAgICAgICAgWy4uLmRvYy5oZWFkLnF1ZXJ5U2VsZWN0b3JBbGwoXCJzdHlsZVwiKV0uZm9yRWFjaChcclxuICAgICAgICAgICAgc3R5bGUgPT4gdGhpcy5zaGFkb3cuYXBwZW5kQ2hpbGQoc3R5bGUpKTtcclxuXHJcbiAgICAgICAgWy4uLmRvYy5ib2R5LmNoaWxkTm9kZXNdLmZvckVhY2goXHJcbiAgICAgICAgICAgIG5vZGUgPT4gdGhpcy5zaGFkb3cuYXBwZW5kQ2hpbGQobm9kZSkpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJsb2ctZW50cnlcIiwgTG9nRW50cnkpO1xyXG5cclxuKChwYW5lbDogUGFuZWxXaW5kb3cpID0+IHtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhcIlNUQVJUOiBwYW5lbC5qc1wiKTtcclxuXHJcbiAgICBjb25zdCAkY29udGVudCA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCJbZGF0YS1jb250ZW50XVwiKSE7XHJcblxyXG4gICAgcGFuZWwub25OYXZpZ2F0aW9uID0gdXJsID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIk9OIE5BVklHQVRJT05cIiwgdXJsKTtcclxuXHJcbiAgICAgICAgLy8gVE9ETyBhZGQgXCJQcmVzZXJ2ZSBMb2dcIiBvcHRpb24gKHNpbWlsYXIgdG8gdGhlIFwiTmV0d29ya1wiIHRhYilcclxuICAgICAgICAkY29udGVudC5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgfTtcclxuXHJcbiAgICBwYW5lbC5vblJlcXVlc3QgPSB0cmFuc2FjdGlvbiA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJPTiBSRVFVRVNUXCIsIHRyYW5zYWN0aW9uKTtcclxuXHJcbiAgICAgICAgLy8gTk9URTogd2VpcmQgdHlwZWNhc3RzIHJlcXVpcmVkIGhlcmUgYmVjYXVzZSB0aGUgcmVxdWVzdC9yZXNwb25zZSBwcm9wZXJ0aWVzXHJcbiAgICAgICAgLy8gICAgICAgYXJlbid0IGRlZmluZWQgaW4gYEB0eXBlcy9jaHJvbWVgIC0gd2UgaGF2ZSB0byBwdWxsIHRoZXNlIGRlZmluaXRpb25zXHJcbiAgICAgICAgLy8gICAgICAgZnJvbSBhIHNlcGFyYXRlIHBhY2thZ2UgYEB0eXBlcy9oYXItZm9ybWF0YCBhbmQgbWFudWFsbHkgY2FzdDpcclxuXHJcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9ICh0cmFuc2FjdGlvbiBhcyBhbnkpLnJlcXVlc3QgYXMgUmVxdWVzdDtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9ICh0cmFuc2FjdGlvbiBhcyBhbnkpLnJlc3BvbnNlIGFzIFJlc3BvbnNlO1xyXG5cclxuICAgICAgICBjb25zdCB0aXRsZSA9IGBbJHtyZXNwb25zZS5zdGF0dXN9ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1dICR7cmVxdWVzdC5tZXRob2R9ICR7cmVxdWVzdC51cmx9YDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaGVhZGVyIG9mIHJlc3BvbnNlLmhlYWRlcnMpIHtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGhlYWRlci5uYW1lLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJ4LWNocm9tZWxvZ2dlci1kYXRhXCIpIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZExvZyh0aXRsZSwgXCJYLUNocm9tZUxvZ2dlci1EYXRhXCIsIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2cgPSBKU09OLnBhcnNlKGF0b2IoaGVhZGVyLnZhbHVlKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBBUlNFRCBDSFJPTUUtTE9HR0VSIEhFQURFUlwiLCBsb2cpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZW5kZXJMb2cobG9nIGFzIExvZykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChgRXJyb3IgcGFyc2luZyBYLUNocm9tZUxvZ2dlci1EYXRhIGhlYWRlciAoJHtlcnJvcn0pYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJ4LXNlcnZlcmxvZy1sb2NhdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICBoZWFkZXIudmFsdWUuc3BsaXQoXCIsXCIpLm1hcCh2YWx1ZSA9PiB2YWx1ZS50cmltKCkpLmZvckVhY2godmFsdWUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwodmFsdWUsIHJlcXVlc3QudXJsKS5ocmVmO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBhcHBlbmRMb2codGl0bGUsIHVybCwgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmZXRjaCh1cmwsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IG5ldyBIZWFkZXJzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkFjY2VwdFwiOiBcInRleHQvaHRtbCwgYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGxvZ19yZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdHlwZSA9IGxvZ19yZXNwb25zZS5oZWFkZXJzLmdldChcIkNvbnRlbnQtVHlwZVwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHR5cGUgJiYgdHlwZS5tYXRjaCgvXnRleHRcXC9odG1sLykgfHwgKCF0eXBlICYmIHVybC5tYXRjaCgvXFwuaHRtbCQvKSkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGRVRDSCBIVE1MXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUobG9nX3Jlc3BvbnNlLnRleHQoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkVUQ0ggSlNPTlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGxvZ19yZXNwb25zZS5qc29uKCkudGhlbihqc29uID0+IHJlbmRlckxvZyhqc29uKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoYFVuYWJsZSB0byBsb2FkIHNlcnZlci1sb2cgZnJvbTogJHt1cmx9ICgke2Vycm9yfSlgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBcHBlbmQgYSBsb2cgZG9jdW1lbnQgdG8gdGhlIFwiU2VydmVyIExvZ1wiIHBhbmVsXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGFwcGVuZExvZyh0aXRsZTogc3RyaW5nLCBzb3VyY2U6IHN0cmluZywgZG9jdW1lbnRQcm9taXNlOiBQcm9taXNlPHN0cmluZz4pIHtcclxuICAgICAgICBjb25zdCBoZWFkZXIgPSBhcHBlbmRIZWFkZXIoXCJzcGlubmVyXCIsIHRpdGxlLCBzb3VyY2UpO1xyXG5cclxuICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsb2ctZW50cnlcIikgYXMgTG9nRW50cnk7XHJcblxyXG4gICAgICAgICRjb250ZW50LmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbiAgICAgICAgZG9jdW1lbnRQcm9taXNlXHJcbiAgICAgICAgICAgIC50aGVuKGh0bWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgZWwuc2V0SFRNTChodG1sKTtcclxuXHJcbiAgICAgICAgICAgICAgICBoZWFkZXIuc2V0SWNvbihcImNoZWNrXCIpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgICAgICAgICAgICAgZWwuc2V0SFRNTChgPHByZSBzdHlsZT1cImNvbG9yOnJlZDsgcGFkZGluZy1sZWZ0OjIwcHg7XCI+JHtodG1sKGVycm9yKX08L3ByZT5gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBoZWFkZXIuc2V0SWNvbihcImVycm9yXCIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhIGhlYWRlciB3aXRoIGFuIGljb24sIHRpdGxlIGFuZCBzb3VyY2Ugb2YgdGhlIHJlcXVlc3RcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gYXBwZW5kSGVhZGVyKGljb246IEljb24sIHRpdGxlOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG5cclxuICAgICAgICBlbC5pbm5lckhUTUwgPSAoYFxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyICR7aWNvbiA/IGBoZWFkZXItLSR7aWNvbn1gIDogYGB9XCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyX19pY29uXCI+JHtcclxuICAgICAgICAgICAgICAgICAgICBpY29uID8gYDxzcGFuIGNsYXNzPVwiaWNvblwiPjwvc3Bhbj5gIDogYGBcclxuICAgICAgICAgICAgICAgIH08L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJfX3RpdGxlXCI+JHtodG1sKHRpdGxlKX08L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJfX3NvdXJjZVwiPiR7aHRtbChzb3VyY2UpfTwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5gXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgJGNvbnRlbnQuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBzZXRJY29uKGljb246IEljb24pIHtcclxuICAgICAgICAgICAgZWwucXVlcnlTZWxlY3RvcihcIi5pY29uXCIpIS5jbGFzc05hbWUgPSBgaWNvbiBpY29uLSR7aWNvbn1gO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHNldEljb24oaWNvbik7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHNldEljb25cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBFc2NhcGUgcGxhaW4gdGV4dCBhcyBIVE1MXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGh0bWwoc3RyOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gKHN0ciB8fCAnJylcclxuICAgICAgICAgICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcclxuICAgICAgICAgICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XHJcbiAgICB9XHJcbiAgICBcclxufSkod2luZG93IGFzIFBhbmVsV2luZG93KTtcclxuXHJcbi8qXHJcblxyXG4vLyBOT1RFOiBkb24ndCBuZWVkIHRoaXMgZm9yIG5vdyAtIG1pZ2h0IG5lZWQgaXQgdG8gY29tbXVuaWNhdGUgd2l0aCBcImJhY2tncm91bmQuanNcIlxyXG5cclxucGFuZWxfd2luZG93LmRvX3NvbWV0aGluZyA9IChtc2c6IHN0cmluZykgPT4ge1xyXG4gICAgY29uc29sZS5sb2coXCJET0lORyBTT01FVEhJTkdcIik7XHJcbiAgICBkb2N1bWVudC5ib2R5LnRleHRDb250ZW50ICs9ICdcXG4nICsgbXNnOyAvLyBTdHVwaWQgZXhhbXBsZSwgUG9DXHJcbn1cclxuXHJcbmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvLyBObyBuZWVkIHRvIGNoZWNrIGZvciB0aGUgZXhpc3RlbmNlIG9mIGByZXNwb25kYCwgYmVjYXVzZVxyXG4gICAgLy8gdGhlIHBhbmVsIGNhbiBvbmx5IGJlIGNsaWNrZWQgd2hlbiBpdCdzIHZpc2libGUuLi5cclxuICAgIHBhbmVsX3dpbmRvdy5yZXNwb25kKCdBbm90aGVyIHN0dXBpZCBleGFtcGxlIScpO1xyXG59O1xyXG4qL1xyXG4iXX0=