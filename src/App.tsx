import { useEffect, useMemo, useState } from 'react';
import { compareVersions, loadBuilds, sortVersions, uniqueSorted } from './dataLoader';
import type { EnrichedBuild, Loader, Platform, ReleaseType } from './types';

const CONTRIBUTION_URL = 'https://github.com/EastArctica/JsMacros-Version-Finder/blob/main/data/README.md';

type Tab = 'guide' | 'list';
type SortKey = 'publishedAt' | 'mcVersion' | 'jsMacrosVersion';

type SortDirection = 'asc' | 'desc';

function formatDate(value?: string) {
  if (!value) return '–';
  // Avoids localization issues by parsing manually
  const [year, month, day] = value.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

function releaseColor(releaseType: ReleaseType) {
  switch (releaseType) {
    case 'release':
      return '#7cc7ff';
    case 'beta':
      return '#f0d165';
    case 'nightly':
      return '#f28ab2';
  }
}

function buildMatchesExtensions(build: EnrichedBuild, required: string[]) {
  if (!required.length) return true;
  return required.every((ext) => build.extensions.includes(ext));
}

function platformLabel(platform: Platform | Platform[]) {
  return Array.isArray(platform) ? platform.join(', ') : platform;
}

function App() {
  const [tab, setTab] = useState<Tab>('guide');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [builds, setBuilds] = useState<EnrichedBuild[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>('');

  const [selectedMcVersion, setSelectedMcVersion] = useState<string>('');
  const [selectedLoader, setSelectedLoader] = useState<Loader | ''>('');
  const [extensionFilters, setExtensionFilters] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('publishedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    loadBuilds().then(({ data, builds: loaded, error: err }) => {
      if (err) {
        setError(err);
      }
      if (data) {
        setUpdatedAt(data.updatedAt);
      }
      setBuilds(loaded);
      setLoading(false);

      // Default to the latest version
      const mcVersions = sortVersions(
        loaded.map((b) => b.mcVersion),
        'desc',
      );
      const latest = mcVersions[0] ?? '';
      setSelectedMcVersion(latest);
    });
  }, []);

  const mcVersions = useMemo(
    () =>
      sortVersions(
        builds.map((b) => b.mcVersion),
        'desc',
      ),
    [builds],
  );
  const loaders = useMemo(() => uniqueSorted(builds.flatMap((b) => b.modLoader)), [builds]);
  const extensions = useMemo(() => uniqueSorted(builds.flatMap((b) => b.extensions)), [builds]);

  const guideResults = useMemo(() => {
    return builds
      .filter((b) => {
        if (selectedMcVersion && b.mcVersion !== selectedMcVersion) return false;
        if (selectedLoader && !b.modLoader.includes(selectedLoader)) return false;
        return buildMatchesExtensions(b, extensionFilters);
      })
      .sort((a, b) => {
        // Show newer builds first so older ones sit lower in the list
        const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        if (da !== db) return db - da;
        return compareVersions(b.mcVersion, a.mcVersion);
      });
  }, [builds, selectedLoader, selectedMcVersion, extensionFilters]);

  const listResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = builds.filter((b) => {
      if (!term) return true;
      const haystack = [
        b.mcVersion,
        b.jsMacrosVersion,
        b.fork,
        b.repo,
        b.sourceUrl ?? '',
        b.releaseType,
        b.deprecated ? 'deprecated' : '',
        b.modLoader.join(' '),
        b.extensions.join(' '),
        b.notes ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });

    const sorted = [...filtered].sort((a, b) => {
      const factor = sortDirection === 'asc' ? 1 : -1;
      if (sortKey === 'publishedAt') {
        const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return (da - db) * factor;
      }
      if (sortKey === 'mcVersion') {
        return compareVersions(a.mcVersion, b.mcVersion) * factor;
      }
      return a.jsMacrosVersion.localeCompare(b.jsMacrosVersion) * factor;
    });

    return sorted;
  }, [builds, search, sortKey, sortDirection]);

  const guideEmpty = !loading && guideResults.length === 0;

  return (
    <div className='section'>
      <div className='header'>
        <div>
          <h1>JsMacros Version Finder</h1>
          <p className='muted'>Find the right JsMacros build by Minecraft version, loader, and extensions.</p>
        </div>
        <div className='header-actions'>
          {updatedAt ? <span className='badge'>Updated {updatedAt}</span> : null}
          <a href={CONTRIBUTION_URL} target='_blank' rel='noreferrer' className='badge' aria-label='Contribute'>
            <span aria-hidden>⬈</span> Contribute new versions
          </a>
        </div>
      </div>

      <div className='tablist' role='tablist'>
        <button
          type='button'
          className={`tab ${tab === 'guide' ? 'active' : ''}`}
          role='tab'
          onClick={() => setTab('guide')}
        >
          Guide
        </button>
        <button
          type='button'
          className={`tab ${tab === 'list' ? 'active' : ''}`}
          role='tab'
          onClick={() => setTab('list')}
        >
          List
        </button>
      </div>

      {loading && (
        <p className='muted' style={{ marginTop: 14 }}>
          Loading data…
        </p>
      )}
      {error && <p style={{ color: '#f28ab2', marginTop: 10 }}>Error: {error}</p>}

      {!loading && tab === 'guide' && (
        <div style={{ marginTop: 16 }}>
          <h3>Guide</h3>
          <p className='muted' style={{ marginTop: 4 }}>
            Pick your Minecraft version, mod loader, and preferred extensions.
          </p>

          <div className='controls-grid' style={{ marginTop: 12 }}>
            <div>
              <label className='label' htmlFor='mcVersion'>
                Minecraft version
              </label>
              <select
                id='mcVersion'
                className='select'
                value={selectedMcVersion}
                onChange={(e) => setSelectedMcVersion(e.target.value)}
              >
                <option value=''>Any</option>
                {mcVersions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='label' htmlFor='loader'>
                Mod loader
              </label>
              <select
                id='loader'
                className='select'
                value={selectedLoader}
                onChange={(e) => setSelectedLoader(e.target.value as Loader | '')}
              >
                <option value=''>Any</option>
                {loaders.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className='label'>Extensions (require all selected)</span>
              <div className='checkboxes' style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {extensions.map((ext) => {
                  const checked = extensionFilters.includes(ext);
                  return (
                    <label key={ext} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type='checkbox'
                        id={`ext-${ext}`}
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExtensionFilters((prev) => [...prev, ext]);
                          } else {
                            setExtensionFilters((prev) => prev.filter((x) => x !== ext));
                          }
                        }}
                      />
                      <label htmlFor={`ext-${ext}`}>{ext}</label>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {guideEmpty && (
            <p className='muted' style={{ marginTop: 12 }}>
              No builds match those filters. Try clearing loader or extensions.
            </p>
          )}

          {!guideEmpty && (
            <div className='card-grid' style={{ marginTop: 14 }}>
              {guideResults.map((b) => (
                <div key={b.id} className='card'>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      alignItems: 'start',
                      gap: 10,
                    }}
                  >
                    <div>
                      <strong>
                        {b.sourceUrl ? (
                          <a
                            className='link'
                            href={b.sourceUrl}
                            target='_blank'
                            rel='noreferrer'
                            style={{ textDecoration: 'none' }}
                          >
                            {b.fork}
                          </a>
                        ) : (
                          b.fork
                        )}
                      </strong>{' '}
                      · {b.jsMacrosVersion} - {b.mcVersion}
                    </div>
                    <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span
                        className='badge'
                        style={{ borderColor: releaseColor(b.releaseType), color: releaseColor(b.releaseType) }}
                      >
                        {b.releaseType}
                      </span>
                      {b.deprecated ? (
                        <span
                          className='badge'
                          style={{
                            borderColor: '#f28b82',
                            color: '#f28b82',
                            background: 'rgba(242, 139, 130, 0.12)',
                          }}
                        >
                          Deprecated
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className='chip-row'>
                    <span className='chip'>Loader: {b.modLoader.join(', ')}</span>
                    <span className='chip'>Extensions: {b.extensions.join(', ')}</span>
                  </div>
                  {b.notes ? <p className='muted'>{b.notes}</p> : null}
                  <div className='badge-row'>
                    {b.downloads.map((d) => (
                      <a key={d.url} className='badge' href={d.url} target='_blank' rel='noreferrer'>
                        {d.name}
                      </a>
                    ))}
                  </div>
                  <div className='muted' style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>Published {formatDate(b.publishedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'list' && (
        <div style={{ marginTop: 16 }}>
          <h3>All builds</h3>
          <p className='muted' style={{ marginTop: 4 }}>
            Search and sort apply only to this table.
          </p>

          <div className='controls-grid' style={{ marginTop: 12 }}>
            <div>
              <label className='label' htmlFor='search'>
                Search
              </label>
              <input
                id='search'
                className='input'
                placeholder='Search fork, repo, versions, notes...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className='label' htmlFor='sortKey'>
                Sort by
              </label>
              <select
                id='sortKey'
                className='select'
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value='publishedAt'>Published date</option>
                <option value='mcVersion'>Minecraft version</option>
                <option value='jsMacrosVersion'>JsMacros version</option>
              </select>
            </div>
            <div>
              <label className='label' htmlFor='sortDir'>
                Direction
              </label>
              <select
                id='sortDir'
                className='select'
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as SortDirection)}
              >
                <option value='desc'>Desc</option>
                <option value='asc'>Asc</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <table className='table'>
              <thead>
                <tr>
                  <th>MC</th>
                  <th>JsMacros</th>
                  <th>Fork</th>
                  <th>Loader</th>
                  <th>Extensions</th>
                  <th>Release</th>
                  <th>Published</th>
                  <th>Downloads</th>
                </tr>
              </thead>
              <tbody>
                {listResults.map((b) => (
                  <tr key={b.id}>
                    <td>{b.mcVersion}</td>
                    <td>{b.jsMacrosVersion}</td>
                    <td>
                      {b.sourceUrl ? (
                        <a
                          className='link'
                          href={b.sourceUrl}
                          target='_blank'
                          rel='noreferrer'
                          style={{ textDecoration: 'none' }}
                        >
                          {b.fork}
                        </a>
                      ) : (
                        b.fork
                      )}
                    </td>
                    <td>
                      <div className='badge-row'>
                        {b.modLoader.map((l) => (
                          <span key={l} className='badge'>
                            {l}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className='badge-row'>
                        {b.extensions.map((e) => (
                          <span key={e} className='badge'>
                            {e}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className='badge'
                        style={{ borderColor: releaseColor(b.releaseType), color: releaseColor(b.releaseType) }}
                      >
                        {b.releaseType}
                      </span>
                      {b.deprecated ? (
                        <span
                          className='badge'
                          style={{
                            borderColor: '#f28b82',
                            color: '#f28b82',
                            marginLeft: 6,
                            background: 'rgba(242, 139, 130, 0.12)',
                          }}
                        >
                          Deprecated
                        </span>
                      ) : null}
                    </td>
                    <td>{formatDate(b.publishedAt)}</td>
                    <td>
                      <div className='badge-row'>
                        {b.downloads.map((d) => (
                          <a key={d.url} className='badge' href={d.url} target='_blank' rel='noreferrer'>
                            {platformLabel(d.platform)}
                          </a>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {listResults.length === 0 && (
                  <tr>
                    <td colSpan={8} className='muted'>
                      No builds match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
