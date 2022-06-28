const getFirstImage = function(str){
  let data = '';
  str.replace(/<img [^>]*src=['"]([^'"]+)[^>]*>/, function (match, capture) {
              data =  capture;
        });
  return data
}


const networks = {
  baidu: 'http://cang.baidu.com/do/add?iu=@u&it=@t',
  buffer: 'https://bufferapp.com/add?text=@t&url=@u',
  email: 'mailto:?subject=@t&body=@u%0D%0A@d',
  evernote: 'https://www.evernote.com/clip.action?url=@u&title=@t',
  facebook: 'https://www.facebook.com/sharer/sharer.php?u=@u&title=@t&description=@d&quote=@q&hashtag=@h',
  flipboard: 'https://share.flipboard.com/bookmarklet/popout?v=2&url=@u&title=@t',
  hackernews: 'https://news.ycombinator.com/submitlink?u=@u&t=@t',
  instapaper: 'http://www.instapaper.com/edit?url=@u&title=@t&description=@d',
  line: 'http://line.me/R/msg/text/?@t%0D%0A@u%0D%0A@d',
  linkedin: 'https://www.linkedin.com/shareArticle?url=@u',
  messenger: 'fb-messenger://share/?link=@u',
  odnoklassniki: 'https://connect.ok.ru/dk?st.cmd=WidgetSharePreview&st.shareUrl=@u&st.comments=@t',
  pinterest: 'https://pinterest.com/pin/create/button/?url=@u&media=@m&description=@t',
  pocket: 'https://getpocket.com/save?url=@u&title=@t',
  quora: 'https://www.quora.com/share?url=@u&title=@t',
  reddit: 'https://www.reddit.com/submit?url=@u&title=@t',
  skype: 'https://web.skype.com/share?url=@t%0D%0A@u%0D%0A@d',
  telegram: 'https://t.me/share/url?url=@u&text=@t%0D%0A@d',
  tumblr: 'https://www.tumblr.com/share/link?url=@u&name=@t&description=@d',
  twitter: 'https://twitter.com/intent/tweet?text=@t&url=@u&hashtags=@h@tu',
  weibo: 'http://service.weibo.com/share/share.php?url=@u&title=@t&pic=@m',
  whatsapp: 'https://api.whatsapp.com/send?text=@t%0D%0A@u%0D%0A@d',
}

function encodedHashtags(options) {
  if (options.key === 'facebook' && options.hashtags?.length) {
    return '%23' + options.hashtags.split(',')[0]
  }

  return options.hashtags || ''
}

function shareLink(options) {
  let link = networks[options.key]

  /**
   * Twitter sharing shouldn't include empty parameter
   * Source: https://github.com/nicolasbeauvais/vue-social-sharing/issues/143
   */
  if (options.key === 'twitter') {
    if (!options.hashtags?.length) link = link.replace('&hashtags=@h', '')
    if (!options.twitterUser.length) link = link.replace('@tu', '')
  }

  return link
    .replace(/@tu/g, '&via=' + encodeURIComponent(options.twitterUser))
    .replace(/@u/g, encodeURIComponent('{{settings.domain}}' + options.url))
    .replace(/@t/g, encodeURIComponent(options.title || ''))
    .replace(/@d/g, encodeURIComponent(options.description || ''))
    .replace(/@q/g, encodeURIComponent(options.quote || ''))
    .replace(/@h/g, encodedHashtags(options))
    .replace(/@m/g, encodeURIComponent(options.media || ''))
}
function onShare(options) {
  const link = shareLink(options)
  window.open(link, '_blank')
}


function copyText(text, callback) {
  const input = document.createElement('input')
  input.setAttribute('readonly', 'readonly')
  input.setAttribute('value', text)
  document.body.appendChild(input)
  input.setSelectionRange(0, 9999)
  input.select()
  if (document.execCommand('copy')) {
    document.execCommand('copy')
    if (callback) {
      callback()
    }
  }
  document.body.removeChild(input)
}
function onCopy(url) {
  copyText('{{settings.domain}}' + url)
}


function ajaxPost(url, data, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.send(data);

  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      callback(xhr.responseText);
    }
  }
}


function onSubscribe(){
  const emailInput=document.querySelector('#subscribeEmail')
  if(emailInput){
   const email = emailInput.value
   if(email){
      ajaxPost('https://test-api.huski.ai/api/v2/blog/subscription', 'email='+email, function (data) {
        // 后台返回的数据就是 字符串类型。要转成json，必须自己手动转换。
        var res = JSON.parse(data);
        console.log('res', res);
        if(res.code===0){
          alert('Subscribe successfully!')
        }
      });
   }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // 将文章body第一章图片显示出来
  const articleBody=document.querySelectorAll('.article-cover-init')
  if(articleBody){
    for(let i=0;i<articleBody.length;i++){
      const body=articleBody[i]
      const bodyHtml= body.innerHTML
      if(bodyHtml){
        const imageUrl= getFirstImage(bodyHtml)
        body.innerHTML=imageUrl?`<img src="${imageUrl}"/>`:''//`<div class="no-image">NO IMAGE</div>`
        body.setAttribute("class", "article-cover");
        if(!imageUrl) {
          const parent=body.parentElement||body.parentNode
          const className=parent.getAttribute('class')
          if(className.indexOf('article-image-box')>-1){
            parent.nextElementSibling?.setAttribute("class", "col-lg-12 col-sm-12 section-article-list-item-right")
            parent.remove()
            // parent.setAttribute("class", className+" no-image-box")
          }
        }
      }
    }
  }

  const articleDescription=document.querySelectorAll('.article-description')
  if(articleDescription){
    for(let i=0;i<articleDescription.length;i++){
      const descElement=articleDescription[i]
      const desc= descElement.innerText
      if(desc&&descElement){
        descElement.innerHTML=desc.trim()
      }
    }
  }

  const iframe = document.querySelector('iframe')
  if(iframe){
    iframe.remove();
  }


  /**
   * 文章详情页上下切换文章
   */
  const articlePrevious = document.querySelector('.article-previous')
  if (articlePrevious) {
    const currentArticle = articlePrevious.querySelector('.current-article')
    if (currentArticle) {
      articlePrevious.innerHTML =  currentArticle.nextElementSibling?currentArticle.nextElementSibling.innerHTML:''
    }
  }
  const articleNext = document.querySelector('.article-next')
  if (articleNext) {
    const currentArticle = articleNext.querySelector('.current-article')
    if (currentArticle) {
      articleNext.innerHTML = currentArticle.previousElementSibling?currentArticle.previousElementSibling.innerHTML:''
    }
  }

  // // Key map
  // var ENTER = 13;
  // var ESCAPE = 27;
  // var SPACE = 32;
  // var UP = 38;
  // var DOWN = 40;
  // var TAB = 9;

  // function closest (element, selector) {
  //   if (Element.prototype.closest) {
  //     return element.closest(selector);
  //   }
  //   do {
  //     if (Element.prototype.matches && element.matches(selector)
  //       || Element.prototype.msMatchesSelector && element.msMatchesSelector(selector)
  //       || Element.prototype.webkitMatchesSelector && element.webkitMatchesSelector(selector)) {
  //       return element;
  //     }
  //     element = element.parentElement || element.parentNode;
  //   } while (element !== null && element.nodeType === 1);
  //   return null;
  // }

  // // social share popups
  // Array.prototype.forEach.call(document.querySelectorAll('.share a'), function(anchor) {
  //   anchor.addEventListener('click', function(e) {
  //     e.preventDefault();
  //     window.open(this.href, '', 'height = 500, width = 500');
  //   });
  // });

  // // In some cases we should preserve focus after page reload
  // function saveFocus() {
  //   var activeElementId = document.activeElement.getAttribute("id");
  //   sessionStorage.setItem('returnFocusTo', '#' + activeElementId);
  // }
  // var returnFocusTo = sessionStorage.getItem('returnFocusTo');
  // if (returnFocusTo) {
  //   sessionStorage.removeItem('returnFocusTo');
  //   var returnFocusToEl = document.querySelector(returnFocusTo);
  //   returnFocusToEl && returnFocusToEl.focus && returnFocusToEl.focus();
  // }

  // // show form controls when the textarea receives focus or backbutton is used and value exists
  // var commentContainerTextarea = document.querySelector('.comment-container textarea'),
  //   commentContainerFormControls = document.querySelector('.comment-form-controls, .comment-ccs');

  // if (commentContainerTextarea) {
  //   commentContainerTextarea.addEventListener('focus', function focusCommentContainerTextarea() {
  //     commentContainerFormControls.style.display = 'block';
  //     commentContainerTextarea.removeEventListener('focus', focusCommentContainerTextarea);
  //   });

  //   if (commentContainerTextarea.value !== '') {
  //     commentContainerFormControls.style.display = 'block';
  //   }
  // }

  // // Expand Request comment form when Add to conversation is clicked
  // var showRequestCommentContainerTrigger = document.querySelector('.request-container .comment-container .comment-show-container'),
  //   requestCommentFields = document.querySelectorAll('.request-container .comment-container .comment-fields'),
  //   requestCommentSubmit = document.querySelector('.request-container .comment-container .request-submit-comment');

  // if (showRequestCommentContainerTrigger) {
  //   showRequestCommentContainerTrigger.addEventListener('click', function() {
  //     showRequestCommentContainerTrigger.style.display = 'none';
  //     Array.prototype.forEach.call(requestCommentFields, function(e) { e.style.display = 'block'; });
  //     requestCommentSubmit.style.display = 'inline-block';

  //     if (commentContainerTextarea) {
  //       commentContainerTextarea.focus();
  //     }
  //   });
  // }

  // // Mark as solved button
  // var requestMarkAsSolvedButton = document.querySelector('.request-container .mark-as-solved:not([data-disabled])'),
  //   requestMarkAsSolvedCheckbox = document.querySelector('.request-container .comment-container input[type=checkbox]'),
  //   requestCommentSubmitButton = document.querySelector('.request-container .comment-container input[type=submit]');

  // if (requestMarkAsSolvedButton) {
  //   requestMarkAsSolvedButton.addEventListener('click', function() {
  //     requestMarkAsSolvedCheckbox.setAttribute('checked', true);
  //     requestCommentSubmitButton.disabled = true;
  //     this.setAttribute('data-disabled', true);
  //     // Element.closest is not supported in IE11
  //     closest(this, 'form').submit();
  //   });
  // }

  // // Change Mark as solved text according to whether comment is filled
  // var requestCommentTextarea = document.querySelector('.request-container .comment-container textarea');

  // var usesWysiwyg = requestCommentTextarea && requestCommentTextarea.dataset.helper === "wysiwyg";

  // function isEmptyPlaintext(s) {
  //   return s.trim() === '';
  // }

  // function isEmptyHtml(xml) {
  //   var doc = new DOMParser().parseFromString(`<_>${xml}</_>`, "text/xml");
  //   var img = doc.querySelector("img");
  //   return img === null && isEmptyPlaintext(doc.children[0].textContent);
  // }

  // var isEmpty = usesWysiwyg ? isEmptyHtml : isEmptyPlaintext;

  // if (requestCommentTextarea) {
  //   requestCommentTextarea.addEventListener('input', function() {
  //     if (isEmpty(requestCommentTextarea.value)) {
  //       if (requestMarkAsSolvedButton) {
  //         requestMarkAsSolvedButton.innerText = requestMarkAsSolvedButton.getAttribute('data-solve-translation');
  //       }
  //       requestCommentSubmitButton.disabled = true;
  //     } else {
  //       if (requestMarkAsSolvedButton) {
  //         requestMarkAsSolvedButton.innerText = requestMarkAsSolvedButton.getAttribute('data-solve-and-submit-translation');
  //       }
  //       requestCommentSubmitButton.disabled = false;
  //     }
  //   });
  // }

  // // Disable submit button if textarea is empty
  // if (requestCommentTextarea && isEmpty(requestCommentTextarea.value)) {
  //   requestCommentSubmitButton.disabled = true;
  // }

  // // Submit requests filter form on status or organization change in the request list page
  // Array.prototype.forEach.call(document.querySelectorAll('#request-status-select, #request-organization-select'), function(el) {
  //   el.addEventListener('change', function(e) {
  //     e.stopPropagation();
  //     saveFocus();
  //     closest(this, 'form').submit();
  //   });
  // });

  // // Submit requests filter form on search in the request list page
  // var quickSearch = document.querySelector('#quick-search');
  // quickSearch && quickSearch.addEventListener('keyup', function(e) {
  //   if (e.keyCode === ENTER) {
  //     e.stopPropagation();
  //     saveFocus();
  //     closest(this, 'form').submit();
  //   }
  // });

  // function toggleNavigation(toggle, menu) {
  //   var isExpanded = menu.getAttribute('aria-expanded') === 'true';
  //   menu.setAttribute('aria-expanded', !isExpanded);
  //   toggle.setAttribute('aria-expanded', !isExpanded);
  // }

  // function closeNavigation(toggle, menu) {
  //   menu.setAttribute('aria-expanded', false);
  //   toggle.setAttribute('aria-expanded', false);
  //   toggle.focus();
  // }

  // var menuButton = document.querySelector('.header .menu-button-mobile');
  // var menuList = document.querySelector('#user-nav-mobile');

  // if(menuButton){
  //   menuButton.addEventListener('click', function(e) {
  //     e.stopPropagation();
  //     toggleNavigation(this, menuList);
  //   });
  
  // }
 

  // if(menuList){
  //   menuList.addEventListener('keyup', function(e) {
  //     if (e.keyCode === ESCAPE) {
  //       e.stopPropagation();
  //       closeNavigation(menuButton, this);
  //     }
  //   });
  // }

  // // Toggles expanded aria to collapsible elements
  // var collapsible = document.querySelectorAll('.collapsible-nav, .collapsible-sidebar');

  // Array.prototype.forEach.call(collapsible, function(el) {
  //   var toggle = el.querySelector('.collapsible-nav-toggle, .collapsible-sidebar-toggle');

  //   el.addEventListener('click', function(e) {
  //     toggleNavigation(toggle, this);
  //   });

  //   el.addEventListener('keyup', function(e) {
  //     if (e.keyCode === ESCAPE) {
  //       closeNavigation(toggle, this);
  //     }
  //   });
  // });

  // // Submit organization form in the request page
  // var requestOrganisationSelect = document.querySelector('#request-organization select');

  // if (requestOrganisationSelect) {
  //   requestOrganisationSelect.addEventListener('change', function() {
  //     closest(this, 'form').submit();
  //   });
  // }

  // // If multibrand search has more than 5 help centers or categories collapse the list
  // var multibrandFilterLists = document.querySelectorAll(".multibrand-filter-list");
  // Array.prototype.forEach.call(multibrandFilterLists, function(filter) {
  //   if (filter.children.length > 6) {
  //     // Display the show more button
  //     var trigger = filter.querySelector(".see-all-filters");
  //     trigger.setAttribute("aria-hidden", false);

  //     // Add event handler for click
  //     trigger.addEventListener("click", function(e) {
  //       e.stopPropagation();
  //       trigger.parentNode.removeChild(trigger);
  //       filter.classList.remove("multibrand-filter-list--collapsed")
  //     })
  //   }
  // });

  // // If there are any error notifications below an input field, focus that field
  // var notificationElm = document.querySelector(".notification-error");
  // if (
  //   notificationElm &&
  //   notificationElm.previousElementSibling &&
  //   typeof notificationElm.previousElementSibling.focus === "function"
  // ) {
  //   notificationElm.previousElementSibling.focus();
  // }

  // Dropdowns
  
  function Dropdown(toggle, menu) {
    this.toggle = toggle;
    this.menu = menu;

    this.menuPlacement = {
      top: menu.classList.contains("dropdown-menu-top"),
      end: menu.classList.contains("dropdown-menu-end")
    };

    this.toggle.addEventListener("click", this.clickHandler.bind(this));
    this.toggle.addEventListener("keydown", this.toggleKeyHandler.bind(this));
    this.menu.addEventListener("keydown", this.menuKeyHandler.bind(this));
  }

  Dropdown.prototype = {

    get isExpanded() {
      return this.menu.getAttribute("aria-expanded") === "true";
    },

    get menuItems() {
      return Array.prototype.slice.call(this.menu.querySelectorAll("[role='menuitem']"));
    },

    dismiss: function() {
      if (!this.isExpanded) return;

      this.menu.setAttribute("aria-expanded", false);
      this.menu.classList.remove("dropdown-menu-end", "dropdown-menu-top");
    },

    open: function() {
      if (this.isExpanded) return;

      this.menu.setAttribute("aria-expanded", true);
      this.handleOverflow();
    },

    handleOverflow: function() {
      var rect = this.menu.getBoundingClientRect();

      var overflow = {
        right: rect.left < 0 || rect.left + rect.width > window.innerWidth,
        bottom: rect.top < 0 || rect.top + rect.height > window.innerHeight
      };

      if (overflow.right || this.menuPlacement.end) {
        this.menu.classList.add("dropdown-menu-end");
      }

      if (overflow.bottom || this.menuPlacement.top) {
        this.menu.classList.add("dropdown-menu-top");
      }

      if (this.menu.getBoundingClientRect().top < 0) {
        this.menu.classList.remove("dropdown-menu-top")
      }
    },

    focusNextMenuItem: function(currentItem) {
      if (!this.menuItems.length) return;

      var currentIndex = this.menuItems.indexOf(currentItem);
      var nextIndex = currentIndex === this.menuItems.length - 1 || currentIndex < 0 ? 0 : currentIndex + 1;

      this.menuItems[nextIndex].focus();
    },

    focusPreviousMenuItem: function(currentItem) {
      if (!this.menuItems.length) return;

      var currentIndex = this.menuItems.indexOf(currentItem);
      var previousIndex = currentIndex <= 0 ? this.menuItems.length - 1 : currentIndex - 1;

      this.menuItems[previousIndex].focus();
    },

    clickHandler: function() {
      if (this.isExpanded) {
        this.dismiss();
      } else {
        this.open();
      }
    },

    toggleKeyHandler: function(e) {
      switch (e.keyCode) {
        case ENTER:
        case SPACE:
        case DOWN:
          e.preventDefault();
          this.open();
          this.focusNextMenuItem();
          break;
        case UP:
          e.preventDefault();
          this.open();
          this.focusPreviousMenuItem();
          break;
        case ESCAPE:
          this.dismiss();
          this.toggle.focus();
          break;
      }
    },

    menuKeyHandler: function(e) {
      var firstItem = this.menuItems[0];
      var lastItem = this.menuItems[this.menuItems.length - 1];
      var currentElement = e.target;

      switch (e.keyCode) {
        case ESCAPE:
          this.dismiss();
          this.toggle.focus();
          break;
        case DOWN:
          e.preventDefault();
          this.focusNextMenuItem(currentElement);
          break;
        case UP:
          e.preventDefault();
          this.focusPreviousMenuItem(currentElement);
          break;
        case TAB:
          if (e.shiftKey) {
            if (currentElement === firstItem) {
              this.dismiss();
            } else {
              e.preventDefault();
              this.focusPreviousMenuItem(currentElement);
            }
          } else if (currentElement === lastItem) {
            this.dismiss();
          } else {
            e.preventDefault();
            this.focusNextMenuItem(currentElement);
          }
          break;
        case ENTER:
        case SPACE:
          e.preventDefault();
          currentElement.click();
          break;
      }
    }
  }

  var dropdowns = [];
  var dropdownToggles = Array.prototype.slice.call(document.querySelectorAll(".dropdown-toggle"));

  dropdownToggles.forEach(function(toggle) {
    var menu = toggle.nextElementSibling;
    if (menu && menu.classList.contains("dropdown-menu")) {
      dropdowns.push(new Dropdown(toggle, menu));
    }
  });

  document.addEventListener("click", function(evt) {
    dropdowns.forEach(function(dropdown) {
      if (!dropdown.toggle.contains(evt.target)) {
        dropdown.dismiss();
      }
    });
  });
});
