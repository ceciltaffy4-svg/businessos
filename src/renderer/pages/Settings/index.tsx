import { useEffect, useState, useCallback } from 'react'

interface LicenseInfo {
  activated: boolean
  key?: string
  licensee?: string
  edition?: string
}

interface UpdateStatus {
  type: string
  version?: string
  percent?: number
  message?: string
  releaseNotes?: string
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'about' | 'license' | 'updates'>('about')
  const [license, setLicense] = useState<LicenseInfo | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [licenseeInput, setLicenseeInput] = useState('')
  const [licenseMsg, setLicenseMsg] = useState('')
  const [version, setVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const [updateMsg, setUpdateMsg] = useState('')

  const loadLicense = useCallback(async () => {
    const res = await window.api.license.validate()
    if (res.success) setLicense(res.data as LicenseInfo)
  }, [])

  useEffect(() => {
    loadLicense()
    window.api.update.currentVersion().then(res => {
      if (res.success) setVersion(res.data as string)
    })
    const unsub = window.api.update.onStatus((status) => {
      setUpdateStatus(status as UpdateStatus)
    })
    return unsub
  }, [loadLicense])

  const handleActivate = async () => {
    setLicenseMsg('')
    const res = await window.api.license.activate({ key: keyInput, licensee: licenseeInput })
    if (res.success) {
      setLicense(res.data as LicenseInfo)
      setLicenseMsg('License activated successfully!')
      setKeyInput('')
      setLicenseeInput('')
    } else {
      setLicenseMsg('Activation failed: ' + res.error)
    }
  }

  const handleDeactivate = async () => {
    await window.api.license.deactivate()
    setLicense({ activated: false })
    setLicenseMsg('License deactivated')
  }

  const handleCheckUpdate = async () => {
    setUpdateMsg('')
    setUpdateStatus({ type: 'checking' })
    await window.api.update.check()
  }

  const handleDownload = async () => {
    setUpdateMsg('Downloading...')
    await window.api.update.download()
  }

  const handleInstall = async () => {
    await window.api.update.install()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="flex gap-4 border-b border-surface-300 dark:border-surface-600">
        {(['about', 'license', 'updates'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'about' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700">
            <h2 className="text-xl font-semibold mb-4">Business OS</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-surface-500">Version</dt><dd className="font-mono">{version || '1.0.0'}</dd></div>
              <div className="flex justify-between"><dt className="text-surface-500">Edition</dt><dd className="capitalize">{license?.edition || 'Professional'}</dd></div>
              <div className="flex justify-between"><dt className="text-surface-500">License Status</dt><dd>{license?.activated ? <span className="text-green-600 font-medium">Activated</span> : <span className="text-amber-600 font-medium">Not Activated</span>}</dd></div>
              <div className="flex justify-between"><dt className="text-surface-500">Licensee</dt><dd>{license?.licensee || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-surface-500">Platform</dt><dd>{navigator.platform}</dd></div>
            </dl>
          </div>
          <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
            <h3 className="text-sm font-medium text-surface-500 mb-2">Data Location</h3>
            <p className="text-xs font-mono text-surface-400 break-all">%APPDATA%/business-os/data.db</p>
          </div>
        </div>
      )}

      {tab === 'license' && (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700 space-y-6">
          {license?.activated ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-green-700 dark:text-green-400 font-medium">Licensed to {license.licensee}</span>
              </div>
              <div className="bg-surface-50 dark:bg-surface-700 rounded-lg p-4 mb-4">
                <p className="text-xs text-surface-500 mb-1">License Key</p>
                <p className="font-mono text-sm break-all">{license.key}</p>
              </div>
              <button onClick={handleDeactivate} className="text-sm text-red-600 hover:text-red-700 font-medium">
                Deactivate License
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Activate License</h2>
              <p className="text-sm text-surface-500">Enter your license key and registration name to activate this installation.</p>
              <div>
                <label className="block text-sm font-medium mb-1">License Key</label>
                <input
                  type="text"
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Licensee Name</label>
                <input
                  type="text"
                  value={licenseeInput}
                  onChange={e => setLicenseeInput(e.target.value)}
                  placeholder="Company or individual name"
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                />
              </div>
              <button
                onClick={handleActivate}
                disabled={!keyInput || !licenseeInput}
                className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Activate
              </button>
            </div>
          )}
          {licenseMsg && (
            <p className={`text-sm ${licenseMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {licenseMsg}
            </p>
          )}
        </div>
      )}

      {tab === 'updates' && (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Software Updates</h2>
              <p className="text-sm text-surface-500">Current version: {version || '1.0.0'}</p>
            </div>
            <button
              onClick={handleCheckUpdate}
              disabled={updateStatus?.type === 'checking' || updateStatus?.type === 'downloading'}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              Check for Updates
            </button>
          </div>

          {updateStatus && (
            <div className="bg-surface-50 dark:bg-surface-700 rounded-lg p-4 space-y-3">
              {updateStatus.type === 'checking' && <p className="text-sm text-surface-500">Checking for updates...</p>}
              {updateStatus.type === 'available' && (
                <div>
                  <p className="text-sm text-green-600 font-medium">Update available: v{updateStatus.version}</p>
                  {updateStatus.releaseNotes && (
                    <p className="text-xs text-surface-500 mt-1 whitespace-pre-wrap">{updateStatus.releaseNotes}</p>
                  )}
                  <button onClick={handleDownload} className="mt-3 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                    Download Update
                  </button>
                </div>
              )}
              {updateStatus.type === 'not-available' && (
                <p className="text-sm text-surface-500">You are up to date (v{updateStatus.version}).</p>
              )}
              {updateStatus.type === 'downloading' && (
                <div>
                  <p className="text-sm text-surface-500 mb-2">Downloading... {updateStatus.percent}%</p>
                  <div className="w-full bg-surface-200 dark:bg-surface-600 rounded-full h-2">
                    <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${updateStatus.percent}%` }} />
                  </div>
                </div>
              )}
              {updateStatus.type === 'downloaded' && (
                <div>
                  <p className="text-sm text-green-600 font-medium">Update ready to install</p>
                  <button onClick={handleInstall} className="mt-3 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                    Restart & Install
                  </button>
                </div>
              )}
              {updateStatus.type === 'error' && (
                <p className="text-sm text-red-600">Update error: {updateStatus.message}</p>
              )}
            </div>
          )}
          {updateMsg && <p className="text-sm text-surface-500">{updateMsg}</p>}
        </div>
      )}
    </div>
  )
}
