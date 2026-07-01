/* ==========================================================================
   Client-side validation for contact, quote, and order forms
   ========================================================================== */

(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
  var MAX_FILE_MB = 15;
  var ALLOWED_EXT = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];

  function setError(field, message) {
    field.classList.toggle('has-error', !!message);
    var errorEl = field.querySelector('.field-error');
    if (errorEl) errorEl.textContent = message || '';
  }

  function validateRequired(input) {
    return input.value.trim().length > 0;
  }

  function validateField(input) {
    var wrapper = input.closest('.form-field');
    if (!wrapper) return true;

    if (input.hasAttribute('required') && !validateRequired(input)) {
      setError(wrapper, 'This field is required.');
      return false;
    }

    if (input.type === 'email' && input.value && !EMAIL_RE.test(input.value.trim())) {
      setError(wrapper, 'Enter a valid email address.');
      return false;
    }

    if (input.type === 'tel' && input.value && !PHONE_RE.test(input.value.trim())) {
      setError(wrapper, 'Enter a valid phone number.');
      return false;
    }

    if (input.type === 'date' && input.value) {
      var chosen = new Date(input.value);
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (chosen < today) {
        setError(wrapper, 'Deadline cannot be in the past.');
        return false;
      }
    }

    if (input.type === 'number' && input.value !== '') {
      var num = Number(input.value);
      if (Number.isNaN(num) || num <= 0) {
        setError(wrapper, 'Enter a value greater than 0.');
        return false;
      }
    }

    setError(wrapper, '');
    return true;
  }

  function attachLiveValidation(form) {
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      input.addEventListener('blur', function () { validateField(input); });
    });
  }

  function validateForm(form) {
    var valid = true;
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      if (input.type === 'file') return;
      if (!validateField(input)) valid = false;
    });
    return valid;
  }

  function showFormMessage(form, text, isError) {
    var message = form.querySelector('.form-message');
    if (!message) {
      message = document.createElement('p');
      message.className = 'form-message';
      form.appendChild(message);
    }
    message.textContent = text;
    message.className = 'form-message ' + (isError ? 'error' : 'success');
  }

  function bindSubmit(formId) {
    var form = document.getElementById(formId);
    if (!form) return;

    attachLiveValidation(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var fileValid = true;
      var fileInput = form.querySelector('input[type="file"]');
      var fileWrapper = fileInput ? fileInput.closest('.file-drop') : null;

      if (fileInput && fileInput.required && fileInput.files.length === 0) {
        fileValid = false;
        if (fileWrapper) fileWrapper.classList.add('is-dragover');
        showFormMessage(form, 'Please attach the document you need revised.', true);
      }

      if (!validateForm(form) || !fileValid) {
        if (fileValid) showFormMessage(form, 'Please fix the highlighted fields.', true);
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="spinner"></span> Sending...';
      }

      window.setTimeout(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText;
        }
        showFormMessage(form, 'Thanks! Your request has been received — we will get back to you shortly.', false);
        form.reset();
        if (fileWrapper) {
          var fileList = fileWrapper.querySelector('.file-list');
          if (fileList) fileList.innerHTML = '';
        }
      }, 900);
    });
  }

  /* ---------- File drop / picker ---------- */
  document.querySelectorAll('.file-drop').forEach(function (dropZone) {
    var input = dropZone.querySelector('input[type="file"]');
    var fileList = dropZone.querySelector('.file-list');
    if (!input) return;

    function renderFiles(files) {
      if (!fileList) return;
      fileList.innerHTML = '';
      Array.prototype.forEach.call(files, function (file) {
        var ext = file.name.split('.').pop().toLowerCase();
        var sizeMb = file.size / (1024 * 1024);
        var li = document.createElement('li');
        var issues = [];

        if (ALLOWED_EXT.indexOf(ext) === -1) issues.push('unsupported type');
        if (sizeMb > MAX_FILE_MB) issues.push('exceeds ' + MAX_FILE_MB + 'MB');

        li.textContent = file.name + ' (' + sizeMb.toFixed(1) + ' MB)';
        if (issues.length) {
          li.style.color = 'var(--color-danger)';
          li.textContent += ' — ' + issues.join(', ');
        }
        fileList.appendChild(li);
      });
    }

    dropZone.addEventListener('click', function () { input.click(); });

    input.addEventListener('change', function () {
      renderFiles(input.files);
    });

    ['dragover', 'dragenter'].forEach(function (evt) {
      dropZone.addEventListener(evt, function (e) {
        e.preventDefault();
        dropZone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(function (evt) {
      dropZone.addEventListener(evt, function (e) {
        e.preventDefault();
        dropZone.classList.remove('is-dragover');
      });
    });

    dropZone.addEventListener('drop', function (e) {
      if (e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        renderFiles(input.files);
      }
    });
  });

  bindSubmit('contact-form');
  bindSubmit('order-form');
  bindSubmit('quote-form');
})();
