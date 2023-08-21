### Hi there 👋
![二丫讲梵's github stats](https://github-readme-stats.vercel.app/api?username=eryajf&hide_title=false&hide_border=true&show_icons=true&include_all_commits=true&line_height=20&bg_color=0,EC6C6C,FFD479,FFFC79,73FA79&theme=graywhite&locale=cn)![主要使用语言](https://github-readme-stats.vercel.app/api/top-langs/?username=eryajf&hide_title=false&hide_border=true&layout=compact&bg_color=0,73FA79,73FDFF,D783FF&theme=graywhite&locale=cn)

![profile](https://github-profile-trophy.vercel.app/?username=eryajf&theme=algolia&column=8)
![snake](./assets/github-contribution-grid-snake.svg)
![snake](./assets/github-contribution-grid-snake.svg)
[![Readme Card](https://github-readme-stats.vercel.app/api/pin/?username=eryajf&repo=ldapctl&show_owner=true&&theme=cobalt)](https://github.com/eryajf/ldapctl)
<!--
**Tanora001/Tanora001** is a ✨ _special_ ✨ repository because its `README.md` (this file) appears on your GitHub profile.

Here are some ideas to get you started:

- 🔭 I’m currently working on ...
- 🌱 I’m currently learning ...
- 👯 I’m looking to collaborate on ...
- 🤔 I’m looking for help with ...
- 💬 Ask me about ...
- 📫 How to reach me: ...
- 😄 Pronouns: ...
- ⚡ Fun fact: ...
-->
name: Latest blog post workflow
on:
  schedule: # Run workflow automatically
    - cron: '0 * * * *'
  workflow_dispatch:
jobs:
  update-readme-with-blog:
    name: Update this repo's README with latest blog posts
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Pull in eryajf posts
        uses: gautamkrishnar/blog-post-workflow@v1
        with:
          max_post_count: 6
          committer_username: "eryajf"
          committer_email: "eryajf@163.com"
          feed_list: "https://wiki.eryajf.net/rss.xml"
          template: "$newline- $randomEmoji(💯,🔥,💫,🚀,🌮,📝,🥳,💻,🧰,🏊,🥰,🧐,🤓,😎,🥸,🤩,🤗,🤔,🫣,🤭,🤠,👹,👺,🤡,🤖,🎃,😺,🫶,👍,💪,💄,👀,🧠,🧑‍🏫,👨‍🏫,💂,🧑‍💻,🥷,💃,🕴,💼,🎓,🐻,🐵,🙉,🦄,🦆,🦅,🦍,🦣,🐘,🦒,🦏,🐎,🦩,🐲,🌝,🌜,🌏,🌈,🌊,🎬,🎭,🚀,🚦,⛽️,🗽,🎡,🌋,🌁,💡,🕯,🪜,🧰,⚗️,🔭,🪄,🎊,🎉,) [$title]($url) $newline"
