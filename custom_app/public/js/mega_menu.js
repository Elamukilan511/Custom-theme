frappe.ready(() => {
  let activeMenuPath = []; // Store active menu path
  let activeMenuLabel = null; // Store current menu label
  let showThirdColumn = false; // New state to control third column visibility

  // Add breadcrumb container in mobile view
  const mobileHeader = document.querySelector(".navbar-nav");
  // const breadcrumbContainer = document.createElement("div");
  // breadcrumbContainer.classList.add("breadcrumb-container", "align-items-center", "px-2");
  // breadcrumbContainer.style.color = "#ffffff";
  // const firstMegaMenu = document.querySelector(".ms-megamnu");
  // if (firstMegaMenu) {
  //   firstMegaMenu.insertAdjacentElement("beforebegin", breadcrumbContainer);
  // }

  function updateBreadcrumbs() {
    breadcrumbContainer.innerHTML = "";

    if (activeMenuPath.length > 0) {
      const breadcrumb = document.createElement("div");
      breadcrumb.classList.add("breadcrumb", "d-flex", "flex-wrap");

      activeMenuPath.forEach((title, index) => {
        const span = document.createElement("span");
        span.textContent = title;
        span.classList.add("breadcrumb-item");
        span.style.cursor = index < activeMenuPath.length - 1 ? "pointer" : "default";
        span.style.fontSize = "14px";
        span.style.padding = "0 4px";
        breadcrumb.appendChild(span);

        if (index < activeMenuPath.length - 1) {
          const separator = document.createElement("span");
          separator.textContent = " / ";
          separator.style.padding = "0 4px";
          breadcrumb.appendChild(separator);
        }
      });

      breadcrumbContainer.appendChild(breadcrumb);

      const visibleMenuBlock = document.querySelector(
        `#mobile-menu-${activeMenuLabel} ul[data-level]:not([style*="display: none"])`
      );
      if (visibleMenuBlock && visibleMenuBlock.parentNode) {
        visibleMenuBlock.parentNode.insertBefore(breadcrumbContainer, visibleMenuBlock);
      }
    }
  }

  document.querySelectorAll(".ms-megamnu").forEach((megaMenuItem) => {
    const label = megaMenuItem.querySelector(".nav-link").textContent.toLowerCase();
    const megamenuValue = megaMenuItem.querySelector(".nav-link").getAttribute("data-megamenu");

    if (megamenuValue) {
      fetchAndRenderMegaMenu(label, megamenuValue);
    } else {
      console.error(`No MegaMenu value found for ${label}`);
    }

    const megaMenuToggle = megaMenuItem.querySelector(".nav-link");
    megaMenuToggle.addEventListener("click", (e) => {
      if (window.matchMedia("(max-width: 991px)").matches) {
        e.preventDefault();
        const parent = megaMenuItem;
        const mobileMenu = document.getElementById(`mobile-menu-${label}`);

        parent.classList.toggle("show");
        if (parent.classList.contains("show")) {
          document.querySelectorAll(".navbar-nav .nav-item").forEach(item => {
            if (item !== parent) {
              item.style.display = "none";
            }
          });

          const firstLevel = mobileMenu.querySelector(`ul[data-level="0"]`);
          if (firstLevel) {
            firstLevel.style.display = "block";
            mobileMenu.querySelectorAll(`ul[data-level]`).forEach(ul => {
              if (ul !== firstLevel) {
                ul.style.display = "none";
              }
            });
          }
          activeMenuLabel = label;
          activeMenuPath = [label.toUpperCase()];
          showThirdColumn = false; // Reset third column state
          // updateBreadcrumbs();
        } else {
          document.querySelectorAll(".navbar-nav .nav-item").forEach(item => {
            item.style.display = "block";
          });
          mobileMenu.querySelectorAll(`ul[data-level]`).forEach(ul => {
            ul.style.display = "none";
          });
          activeMenuLabel = null;
          activeMenuPath = [];
          showThirdColumn = false; // Reset third column state
          // updateBreadcrumbs();
        }
      }
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 991) {
      document.querySelectorAll(".navbar-nav .nav-item").forEach(item => {
        item.style.display = "block";
        item.classList.remove("show");
      });
      document.querySelectorAll(".mobile-menu").forEach(mobileMenu => {
        mobileMenu.querySelectorAll(`ul[data-level]`).forEach(ul => {
          ul.style.display = "none";
        });
      });
      // breadcrumbContainer.style.display = "none";
      if (activeMenuLabel && activeMenuPath.length > 0) {
        restoreWebMenuState(activeMenuLabel);
      }
    } else {
      // breadcrumbContainer.style.display = "block";
      if (activeMenuLabel && activeMenuPath.length > 0) {
        const megaMenuItem = document.querySelector(`.ms-megamnu [id="megaMenu-${activeMenuLabel}"]`)?.parentElement;
        if (megaMenuItem) {
          const label = activeMenuLabel;
          const megamenuValue = megaMenuItem.querySelector(".nav-link").getAttribute("data-megamenu");
          if (megamenuValue) {
            fetchAndRenderMegaMenu(label, megamenuValue);
          }
        }
      }
    }
  });

  function fetchAndRenderMegaMenu(label, megamenuValue) {
    frappe.call({
      method: "custom_app.api.mega_menu.get_megamenu",
      args: { root_node: megamenuValue },
      callback: function (r) {
        if (r.message && r.message.menu && r.message.menu.length > 0) {
          console.log(`MegaMenu data fetched for ${label}:`, r.message);
          renderMegaMenu(r.message.menu, r.message.promo_image, r.message.promo_text, label);
        } else {
          console.error(`No MegaMenu data returned for ${label}:`, r.message);
          renderMegaMenu([], "/files/bio_img.png", "Explore our advanced gene research tools", label);
        }
      },
      error: function (err) {
        console.error(`Error fetching MegaMenu for ${label}:`, err);
        renderMegaMenu([], "/files/bio_img.png", "Explore our advanced gene research tools", label);
      }
    });
  }

  function updateActivePath(label, item, child = null, grandChild = null) {
    activeMenuLabel = label;
    activeMenuPath = [label.toUpperCase()];
    if (item) activeMenuPath.push(item.title);
    if (child) activeMenuPath.push(child.title);
    if (grandChild) activeMenuPath.push(grandChild.title);
    showThirdColumn = !!grandChild; // Only show third column if grandChild exists
    // updateBreadcrumbs();
    if (window.innerWidth > 991) {
      restoreWebMenuState(activeMenuLabel);
    }
  }

  function restoreMobileMenuState(label, mobileMenu, menuData) {
    if (window.innerWidth <= 991 && activeMenuLabel === label && activeMenuPath.length > 0) {
      const ulElements = mobileMenu.querySelectorAll(`ul[data-level]`);
      let currentItems = menuData;
      let currentLevel = 0;

      const parentNavItem = mobileMenu.closest(".nav-item");
      parentNavItem.classList.add("show");
      document.querySelectorAll(".navbar-nav .nav-item").forEach(item => {
        if (item !== parentNavItem) {
          item.style.display = "none";
        }
      });

      activeMenuPath.forEach((title, index) => {
        if (index === 0) return; // Skip initial label
        const item = currentItems.find(i => i.title.toLowerCase() === title.toLowerCase().replace(/-/g, " "));
        if (item && item.children) {
          const ul = ulElements[index];
          if (ul) {
            ul.style.display = "block";
            ulElements.forEach(u => {
              if (u !== ul && parseInt(u.getAttribute("data-level")) >= currentLevel) {
                u.style.display = "none";
              }
            });
          }
          currentItems = item.children;
          currentLevel++;
        }
      });
      // updateBreadcrumbs();
    }
  }

  function restoreWebMenuState(label) {
    if (window.innerWidth > 991 && activeMenuPath.length > 0) {
      const serviceList = document.getElementById(`service-list-${label}`);
      const subserviceList = document.getElementById(`subservice-list-${label}`);
      const subsubserviceList = document.getElementById(`subsubservice-list-${label}`);

      let currentItems = Array.from(serviceList.children).filter(li => !li.classList.contains("text-muted"));
      activeMenuPath.forEach((title, index) => {
        if (index === 0) return; // Skip initial label
        const item = currentItems.find(li => li.textContent.toLowerCase() === title.toLowerCase().replace(/-/g, " "));
        if (item) {
          setActiveItem(index === 1 ? serviceList : index === 2 ? subserviceList : subsubserviceList, item);
          if (index === 1 && subserviceList) {
            const serviceData = { children: menuData[label]?.find(s => s.title.toLowerCase() === title.toLowerCase().replace(/-g/, " "))?.children || [] };
            populateColumn(subserviceList, serviceData.children, subsubserviceList, "Hover a sub-service to see details");
            if (!showThirdColumn) subsubserviceList.style.display = "none"; // Hide third column unless explicitly set
          } else if (index === 2 && subsubserviceList) {
            const subserviceData = { children: menuData[label]?.find(s => s.title.toLowerCase() === activeMenuPath[1].toLowerCase().replace(/-g/, " "))?.children.find(ss => ss.title.toLowerCase() === title.toLowerCase().replace(/-g/, " "))?.children || [] };
            populateColumn(subsubserviceList, subserviceData.children, null);
          }
        }
      });
    }
  }

  const menuData = {};

  function renderMegaMenu(menu, promoImage, promoText, label) {
    menuData[label] = menu;

    const promoImageElement = document.getElementById(`promo-image-${label}`);
    const promoTextElement = document.getElementById(`promo-text-${label}`);
    if (promoImageElement && promoTextElement) {
      promoImageElement.src = promoImage;
      promoTextElement.textContent = promoText;
    }

    const serviceList = document.getElementById(`service-list-${label}`);
    const subserviceList = document.getElementById(`subservice-list-${label}`);
    const subsubserviceList = document.getElementById(`subsubservice-list-${label}`);

    clearAndSetPlaceholder(serviceList, menu.length === 0 ? "No services available" : "");
    clearAndSetPlaceholder(subserviceList, "Hover a service to see more");
    clearAndSetPlaceholder(subsubserviceList, "Hover a sub-service to see details");

    menu.forEach((service) => {
      const serviceItem = createMenuItem(service);
      serviceItem.addEventListener("mouseenter", () => {
        setActiveItem(serviceList, serviceItem);
        updateActivePath(label, service);
        populateColumn(subserviceList, service.children || [], subsubserviceList, "Hover a sub-service to see details", service);
      });
      serviceItem.addEventListener("click", (e) => {
        e.stopPropagation();
        setActiveItem(serviceList, serviceItem);
        updateActivePath(label, service);
        populateColumn(subserviceList, service.children || [], null, "Hover a sub-service to see details", service); // Disable third column on click
        showThirdColumn = false; // Explicitly reset third column state
      });
      serviceList.appendChild(serviceItem);
    });

    if (window.innerWidth > 991 && activeMenuLabel === label && activeMenuPath.length > 0) {
      restoreWebMenuState(label);
    }

    if (window.innerWidth <= 991) {
      const mobileMenu = document.getElementById(`mobile-menu-${label}`);
      mobileMenu.innerHTML = "";
      const menuStack = [{ items: menu, level: 0, parentUl: null, parentItem: null, parentTitle: label.toUpperCase() }];
      const ulElements = [];

      while (menuStack.length > 0) {
        const { items, level, parentUl, parentItem, parentTitle } = menuStack.shift();
        const ul = document.createElement("ul");
        ul.classList.add("list-unstyled");
        ul.setAttribute("data-level", level.toString());
        ul.style.display = level === 0 ? "block" : "none";
        ulElements.push({ level, ul, parentUl, parentItem });

        const backHeading = document.createElement("li");
        backHeading.classList.add("back-heading");
        const backArrow = document.createElement("span");
        backArrow.classList.add("back-arrow");
        backArrow.textContent = "← " ;
        backHeading.appendChild(backArrow );

        if (level > 0) {
          const headingText = document.createElement("span");
          headingText.classList.add("heading-text");
          headingText.textContent = parentTitle;
          backHeading.appendChild(headingText);
        }

        backHeading.addEventListener("click", (e) => {
          e.stopPropagation();
          if (level === 0) {
            const parentNavItem = mobileMenu.closest(".nav-item");
            parentNavItem.classList.remove("show");
            document.querySelectorAll(".navbar-nav .nav-item").forEach(item => {
              item.style.display = "block";
            });
            mobileMenu.querySelectorAll(`ul[data-level]`).forEach(deeperUl => {
              deeperUl.style.display = "none";
            });
            activeMenuLabel = null;
            activeMenuPath = [];
            showThirdColumn = false; // Reset third column state
          } else {
            ul.style.display = "none";
            const parentEntry = ulElements.find(entry => entry.ul === parentUl);
            if (parentEntry) {
              parentEntry.ul.style.display = "block";
              mobileMenu.querySelectorAll(`ul[data-level]`).forEach(deeperUl => {
                const deeperLevel = parseInt(deeperUl.getAttribute("data-level"));
                if (deeperLevel > parentEntry.level) {
                  deeperUl.style.display = "none";
                }
              });
              activeMenuPath.pop();
              showThirdColumn = false; // Reset third column state
            }
          }
          // updateBreadcrumbs();
        });

        ul.appendChild(backHeading);

        items.forEach(item => {
          const li = document.createElement("li");
          li.textContent = item.title;
          if (item.children && item.children.length > 0) {
            li.classList.add("has-children");
            li.addEventListener("click", (e) => {
              e.stopPropagation();
              ul.style.display = "none";
              const childUl = ulElements.find(entry =>
                entry.level === level + 1 && entry.parentItem === item
              );
              if (childUl) {
                childUl.ul.style.display = "block";
                mobileMenu.querySelectorAll(`ul[data-level]`).forEach(deeperUl => {
                  const deeperLevel = parseInt(deeperUl.getAttribute("data-level"));
                  if (deeperLevel > level + 1) {
                    deeperUl.style.display = "none";
                  }
                });

                if (!activeMenuPath.includes(item.title)) {
                  activeMenuPath.push(item.title);
                }
                // updateBreadcrumbs();
                restoreMobileMenuState(label, mobileMenu, menuData[label]);
              }
            });

            menuStack.push({ items: item.children, level: level + 1, parentUl: ul, parentItem: item, parentTitle: item.title.toUpperCase() });
          } else {
            li.addEventListener("click", () => {
              if (item.route) {
                window.location.href = item.route;
              }
              updateActivePath(label, item);
            });
          }
          ul.appendChild(li);
        });

        mobileMenu.appendChild(ul);
      }

      restoreMobileMenuState(label, mobileMenu, menu);
    }
  }

  function populateColumn(container, items, nextContainer = null, placeholder = "", parentItem = null) {
    clearAndSetPlaceholder(container, items.length === 0 ? placeholder : "");
    if (nextContainer) {
      clearAndSetPlaceholder(nextContainer, placeholder);
      nextContainer.style.display = showThirdColumn ? "block" : "none"; // Control third column based on state
    }

    items.forEach(item => {
      const menuItem = createMenuItem(item);
      menuItem.addEventListener("mouseenter", () => {
        setActiveItem(container, menuItem);
        const label = activeMenuLabel || container.closest(".ms-megamnu-menu")?.id.split("-")[2];
        if (parentItem) updateActivePath(label, parentItem, item);
        if (item.children && item.children.length > 0 && nextContainer) {
          populateColumn(nextContainer, item.children, null, "", item);
          nextContainer.style.display = "block"; // Show on hover if grandchildren exist
        } else if (nextContainer) {
          nextContainer.style.display = "none"; // Hide if no grandchildren
        }
      });
      menuItem.addEventListener("click", (e) => {
        e.stopPropagation();
        setActiveItem(container, menuItem);
        const label = activeMenuLabel || container.closest(".ms-megamnu-menu")?.id.split("-")[2];
        if (parentItem) updateActivePath(label, parentItem, item);
        if (nextContainer) {
          nextContainer.style.display = "none"; // Force hide third column on click
          showThirdColumn = false; // Reset state on click
        }
      });
      container.appendChild(menuItem);
    });
  }

  function createMenuItem(item) {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${item.route || '#'}" class="dropdown-item">${item.title}</a>`;
    if (item.children && item.children.length > 0) {
      li.classList.add("has-children");
    }
    return li;
  }

  function clearAndSetPlaceholder(container, message) {
    container.innerHTML = "";
    if (message) {
      const placeholder = document.createElement("li");
      placeholder.className = "text-muted";
      placeholder.textContent = message;
      container.appendChild(placeholder);
    }
  }

  function setActiveItem(container, activeLi) {
    const links = container.querySelectorAll(".dropdown-item");
    links.forEach(link => link.classList.remove("active"));
    const link = activeLi.querySelector(".dropdown-item");
    if (link) link.classList.add("active");
  }
});
