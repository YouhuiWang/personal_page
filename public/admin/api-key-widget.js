/**
 * Sveltia CMS 自定义字段组件 "apikey"
 * - 字段值保持掩码占位符 "********"，绝不把 API key 写进仓库文件
 * - 提供：当前状态（已配置/未配置/更新时间）+ 新 key 输入 + 管理员密码 + 保存到 Worker
 * - 使用 CMS 全局暴露的 window.h（React createElement），免构建
 */
(function () {
  const ENDPOINT = 'https://deepseek-chat-proxy.wyh-sz2516001.workers.dev';

  // 状态行组件
  function StatusRow({ configured, updatedAt }) {
    return window.h(
      'div',
      { style: { marginBottom: '0.5rem', fontSize: '0.85rem', color: '#6b7280' } },
      configured
        ? 'API Key 已配置' + (updatedAt ? '（更新于 ' + new Date(updatedAt).toLocaleString() + '）' : '')
        : 'API Key 未配置（对话功能暂不可用）',
    );
  }

  function ApiKeyControl(props) {
    // props: { value, field, forID, classNameWrapper, onChange }
    // 注意：不调用 onChange —— 字段值永远保持掩码占位符
    var state = { configured: false, updatedAt: null, msg: '', loading: true };

    function refresh(render) {
      fetch(ENDPOINT + '/admin/key-status')
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (data) {
          state.configured = !!data.configured;
          state.updatedAt = data.updatedAt;
          state.loading = false;
          render();
        })
        .catch(function () {
          state.loading = false;
          state.msg = '无法连接配置服务';
          render();
        });
    }

    function save(render) {
      var key = root.querySelector('[data-ak-input]').value.trim();
      var pw = root.querySelector('[data-ak-password]').value;
      if (!key) {
        state.msg = '请输入新的 API Key';
        render();
        return;
      }
      if (!pw) {
        state.msg = '请输入管理员密码';
        render();
        return;
      }
      state.msg = '保存中…';
      render();
      fetch(ENDPOINT + '/admin/key', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-admin-password': pw,
        },
        body: JSON.stringify({ apiKey: key }),
      })
        .then(function (r) {
          return r.json().then(function (d) { return { ok: r.ok, d: d }; });
        })
        .then(function (res) {
          if (res.ok) {
            state.msg = '保存成功 ✓';
            state.configured = true;
            state.updatedAt = res.d.updatedAt
              ? new Date(res.d.updatedAt).toISOString()
              : null;
            root.querySelector('[data-ak-input]').value = '';
            root.querySelector('[data-ak-password]').value = '';
          } else {
            state.msg =
              res.d.error === 'unauthorized'
                ? '管理员密码错误'
                : res.d.error === 'rate limited'
                  ? '操作过于频繁，请稍后再试'
                  : res.d.error === 'admin password not configured'
                    ? '服务端未配置管理员密码'
                    : '保存失败（' + (res.d.error || '未知错误') + '）';
          }
          render();
        })
        .catch(function () {
          state.msg = '网络错误，请重试';
          render();
        });
    }

    var root = document.createElement('div');
    root.style.border = '1px solid #e5e7eb';
    root.style.borderRadius = '6px';
    root.style.padding = '0.9rem';

    var statusEl = document.createElement('div');
    var formEl = document.createElement('div');
    root.appendChild(statusEl);
    root.appendChild(formEl);

    formEl.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:0.5rem">' +
      '<input data-ak-input type="password" placeholder="输入新的 API Key" style="padding:0.45rem 0.6rem;border:1px solid #d1d5db;border-radius:4px;font-family:monospace">' +
      '<input data-ak-password type="password" placeholder="管理员密码" style="padding:0.45rem 0.6rem;border:1px solid #d1d5db;border-radius:4px">' +
      '<button data-ak-save type="button" style="padding:0.45rem 1rem;background:#1f2937;color:#fff;border:none;border-radius:4px;cursor:pointer;align-self:flex-start">保存到 Worker</button>' +
      '<div data-ak-msg style="font-size:0.8rem;color:#6b7280"></div>' +
      '</div>';

    formEl.querySelector('[data-ak-save]').addEventListener('click', function () {
      save(render);
    });

    function render() {
      statusEl.textContent = state.loading
        ? '加载状态…'
        : state.configured
          ? 'API Key 已配置' +
            (state.updatedAt ? '（更新于 ' + new Date(state.updatedAt).toLocaleString() + '）' : '')
          : 'API Key 未配置（对话功能暂不可用）';
      formEl.querySelector('[data-ak-msg]').textContent = state.msg;
    }

    refresh(render);
    render();

    return root;
  }

  if (window.CMS && window.CMS.registerFieldType) {
    window.CMS.registerFieldType('apikey', ApiKeyControl);
  } else {
    console.error('Sveltia CMS 全局对象不可用，apikey widget 注册失败');
  }
})();
