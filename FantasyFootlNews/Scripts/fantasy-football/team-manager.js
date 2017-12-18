console.log(ffbanter);
var ffbanter = ffbanter || {};
ffbanter.current = ffbanter.current || {};


ffbanter.utility = function() {
    var stripLastIdFromUri = function(uri) {
        var id = uri.match(/\/([^/]*)$/)[1];
        return id;
    }
    return {
        stripLastIdFromUri: stripLastIdFromUri
    }
}();

ffbanter.view = function () {

    var createTeamPlayersLinkAnchor = function (name, href, fixtureId) {
        var aTag = document.createElement("a");
        aTag.setAttribute('data-fixtureId', fixtureId);
        href = href + '/players';
        var anchorHref = "javascript:ffbanter.datasource.loadTeamPlayers('" + href + "', " + fixtureId+")";
        aTag.setAttribute('href', anchorHref);
        aTag.innerHTML = name;
        return aTag;
    }

    var refreshCompetition = function(competition) {

        jQuery("#competitionName").text(competition.caption);

        var fixtureLink = competition._links.fixtures;

        var includeDays = 7;   
        ffbanter.datasource.loadFixturesByDays(fixtureLink.href,includeDays);

    }

    var refreshFixtures = function(fixtures) {
        var fixturesArea = document.getElementById("fixtures");

        while (fixturesArea.firstChild) {
            fixturesArea.removeChild(fixturesArea.firstChild);
        }


        ffbanter.datasource.fixtures.forEach(function (item, index) {
            var li = document.createElement("li");

            var homeAnchor = createTeamPlayersLinkAnchor(item.homeTeamName, item.homeTeamHref, item.fixtureId);
            var awayAnchor = createTeamPlayersLinkAnchor(item.awayTeamName, item.awayTeamHref, item.fixtureId);
            var spanNode = document.createElement("span");

            spanNode.appendChild(homeAnchor);
            spanNode.appendChild(document.createTextNode(" vs "));
            spanNode.appendChild(awayAnchor);

            li.appendChild(spanNode);
            fixturesArea.appendChild(li);
        });
    }

    var refreshTeamPlayers = function (players) {
        var playerSelect = document.getElementById("players");

        while (playerSelect.firstChild) {
            playerSelect.removeChild(playerSelect.firstChild);
        }

        var option = document.createElement("option");
        option.setAttribute('value', 0);
        option.innerHTML = "Please Select...";
        playerSelect.appendChild(option);


        players.forEach(function(item, index) {
            var option = document.createElement("option");
            option.setAttribute('value', item.jerseyNumber);
            option.innerHTML = item.name;
            playerSelect.appendChild(option);
        }); 

    }

    var renderInjuryTypes = function () {
        var injuryTypeSelect = document.getElementById("injuryTypes");

        ffbanter.datasource.injuryTypes.forEach(function(item, index) {
            var option = document.createElement("option");
            option.setAttribute('value', item.id);
            option.innerHTML = item.type;
            injuryTypeSelect.appendChild(option);

        });
    }

    var renderBodyParts = function () {
        var bodyPartsSelect = document.getElementById("bodyParts");

        ffbanter.datasource.bodyParts.forEach(function (item, index) {
            var option = document.createElement("option");
            option.setAttribute('value', item.id);
            option.innerHTML = item.type;
            bodyPartsSelect.appendChild(option);
        });
    }

    var renderArticle = function() {
        var fixture = ffbanter.current.fixture;
        var mainheading = jQuery("#articleContent h1");
        var subheading = jQuery(".lead");

        var fixtureDesc = fixture.homeTeamName + " play at home against " + fixture.awayTeamName + " on " + jQuery.format.date(fixture.date, 'ddd');

        var currentPlayer = ffbanter.current.player + " " + ffbanter.current.injury + " " + ffbanter.current.bodyPart;

        mainheading.text(currentPlayer);
        subheading.text(fixtureDesc);

        jQuery('#criteriaArea').hide();
        jQuery('#articleContent').show();
    }

    var showCriteria = function() {
        jQuery('#criteriaArea').show();
        jQuery('#articleContent').hide();
    }

    return {
        refreshCompetition: refreshCompetition,
        refreshFixtures:refreshFixtures,
        refreshTeamPlayers: refreshTeamPlayers,
        renderInjuryTypes: renderInjuryTypes,
        renderBodyParts: renderBodyParts,
        renderArticle: renderArticle,
        showCriteria: showCriteria
    }
}();

ffbanter.datasource = function() {
    var rootFootballDataApiPath = 'http://api.football-data.org/v1/';

    var loadCompetition = function(competitionId) {
        jQuery.ajax({
            headers: { 'X-Auth-Token': "9a7ccbd093fe46e18b1c014e46be948b" },
            url: rootFootballDataApiPath + "competitions/" + competitionId,
            dataType: "json",
            type: "GET"
        }).done(function (response) {
            ffbanter.view.refreshCompetition(response);
        });
    }

    var loadFixturesByDays = function(link, pastDaysToInclude) {
        var fixtureUrl = link + "?timeFrame=n" + pastDaysToInclude;
        jQuery.ajax({
            headers: { 'X-Auth-Token': "9a7ccbd093fe46e18b1c014e46be948b" },
            url: fixtureUrl,
            dataType: "json",
            type: "GET"
        }).done(function(response) {
            ffbanter.datasource.storeFixtures(response.fixtures);
            ffbanter.view.refreshFixtures(response);
        });
    }

    var loadTeamPlayers = function (link, fixtureId) {

        var fixture = _(ffbanter.datasource.fixtures).find(function(item) {
            return item.fixtureId == fixtureId;
        });
        ffbanter.current.fixture = fixture;

        jQuery.ajax({
            headers: { 'X-Auth-Token': "9a7ccbd093fe46e18b1c014e46be948b" },
            url: link,
            dataType: "json",
            type: "GET"
        }).done(function(response) {
            ffbanter.view.refreshTeamPlayers(response.players);
        });
    }

    var loadInjuryTypes = function() {
        var injuryTypes = Array();
        injuryTypes.push({ id: 0, type: "Please select..." });
        injuryTypes.push({ id: 1, type: "has pulled his" });
        injuryTypes.push({ id: 2, type: "has injured his" });
        injuryTypes.push({ id: 2, type: "has snapped his" });
        return injuryTypes;
    }

    var loadBodyParts = function () {
        var bodyParts = Array();
        bodyParts.push({ id: 0, type: "Please select..." });
        bodyParts.push({ id: 1, type: "ankle" });
        bodyParts.push({ id: 1, type: "metatarsal" });
        bodyParts.push({ id: 1, type: "groin" });
        bodyParts.push({ id: 2, type: "banjo string" });
        return bodyParts;
    }

    var storeFixtures = function(fixtures) {
        if (ffbanter.datasource.features) {
            return;
        }

        var allFixtures = Array();
        fixtures.forEach(function(item, index) {

            var fixtureId = ffbanter.utility.stripLastIdFromUri(item._links.self.href);

            allFixtures.push({
                'fixtureId': fixtureId,
                'homeTeamName': item.homeTeamName,
                'homeTeamHref': item._links.homeTeam.href,
                'awayTeamName': item.awayTeamName,
                'awayTeamHref': item._links.awayTeam.href,
                'date' : item.date
            });
        });

        ffbanter.datasource.fixtures = allFixtures;
    }

    return {
        loadCompetition: loadCompetition,
        loadFixturesByDays: loadFixturesByDays,
        loadTeamPlayers: loadTeamPlayers,
        loadInjuryTypes: loadInjuryTypes,
        loadBodyParts: loadBodyParts,
        storeFixtures: storeFixtures
    }
}();


jQuery(document).ready(function() {
        var competitionId = 445; //premiership id
        ffbanter.datasource.loadCompetition(competitionId);

        ffbanter.datasource.injuryTypes = ffbanter.datasource.loadInjuryTypes();
        ffbanter.view.renderInjuryTypes();

        ffbanter.datasource.bodyParts = ffbanter.datasource.loadBodyParts();
        ffbanter.view.renderBodyParts();

        jQuery("#generateArticle").on('click',
            function () {
                ffbanter.view.renderArticle();
            }
        );

        jQuery('#players').on('change', function (e) {
            ffbanter.current.player = e.target.options[e.target.selectedIndex].text;
        });

        jQuery('#injuryTypes').on('change', function (e) {
            ffbanter.current.injury = e.target.options[e.target.selectedIndex].text;
        });

        jQuery('#bodyParts').on('change', function (e) {
            ffbanter.current.bodyPart = e.target.options[e.target.selectedIndex].text;
        });
});

