# 采集 Tanora001 的真实数据 -> tools/data.json（供 gen.mjs 生成 SVG）
$ErrorActionPreference = 'Stop'
$gh = 'E:\MyProgram\gh.exe'
$out = Join-Path $PSScriptRoot 'data.json'

$query = @'
query {
  user(login: "Tanora001") {
    followers { totalCount }
    contributionsCollection {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date weekday contributionCount } }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: PUSHED_AT, direction: DESC}) {
      totalCount
      nodes { name stargazerCount forkCount diskUsage createdAt pushedAt primaryLanguage { name } }
    }
  }
}
'@

$body = @{ query = $query } | ConvertTo-Json -Compress
$resp = $body | & $gh api graphql --input - 2>&1 | Out-String
$j = $resp | ConvertFrom-Json
$u = $j.data.user

$langAcc = [ordered]@{}
foreach ($r in @('Tanora001/ai-agent-cli','Tanora001/Tanora001.github.io','satio-verse/satio-verse','satio-verse/satio-plugins')) {
  $rsp = & $gh api "repos/$r/languages" 2>&1 | Out-String
  $o = $rsp | ConvertFrom-Json
  foreach ($p in $o.PSObject.Properties) {
    $k = $p.Name
    if ($langAcc.Contains($k)) { $langAcc[$k] = [int64]$langAcc[$k] + [int64]$p.Value } else { $langAcc[$k] = [int64]$p.Value }
  }
}

$weeks = @()
foreach ($w in $u.contributionsCollection.contributionCalendar.weeks) {
  $days = @()
  foreach ($d in $w.contributionDays) {
    $days += [ordered]@{ date = $d.date; weekday = [int]$d.weekday; count = [int]$d.contributionCount }
  }
  $weeks += ,$days
}

$repos = @()
foreach ($n in $u.repositories.nodes) {
  $repos += [ordered]@{
    name  = $n.name
    stars = [int]$n.stargazerCount
    forks = [int]$n.forkCount
    lang  = if ($n.primaryLanguage) { $n.primaryLanguage.name } else { $null }
    kb    = [int64]$n.diskUsage
    pushedAt = $n.pushedAt
    createdAt = $n.createdAt
  }
}

$data = [ordered]@{
  generatedAt = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
  user = [ordered]@{
    login = 'Tanora001'
    name = 'Tanora Vic'
    publicRepos = [int]$u.repositories.totalCount
    followers = [int]$u.followers.totalCount
  }
  contributions = [ordered]@{
    total = [int]$u.contributionsCollection.contributionCalendar.totalContributions
    commits = [int]$u.contributionsCollection.totalCommitContributions
    issues = [int]$u.contributionsCollection.totalIssueContributions
    prs = [int]$u.contributionsCollection.totalPullRequestContributions
    private = [int]$u.contributionsCollection.restrictedContributionsCount
    weeks = $weeks
  }
  repos = $repos
  languages = $langAcc
}

$json = $data | ConvertTo-Json -Depth 12 -Compress
[System.IO.File]::WriteAllText($out, $json, (New-Object System.Text.UTF8Encoding($false)))
"wrote $out ($($json.Length) bytes)"
