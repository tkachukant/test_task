import { mainPageSelectors } from "../pages/mainPage";
import { textContent, urls } from "../valid-data/validInfo";

const currentDate = new Date();

function clickingByDays(numberOfDays) {
  for (let i = 1; i < numberOfDays; i++) {
    const testDate = new Date(currentDate);
    testDate.setDate(currentDate.getDate() + i);
    const dayOfWeekCapitalized = testDate.toLocaleString("uk-UA", {
      weekday: "long",
    });
    const dayOfMonth = testDate.getDate().toString().padStart(2, "0");
    const currentMonth = textContent.months[testDate.getMonth()];

    cy.get("main")
      .find("a")
      .eq(i)
      .should("be.visible")
      .then(($el) => {
        cy.intercept("POST", urls.urlForIntercepting).as("visitStats");
        cy.wrap($el).click();
      });
    cy.wait("@visitStats").then((interception) => {
      cy.wrap(interception.response?.statusCode).should("eq", 202);
    });
    //i assume classes are not dynamic, nothing was mentioned about it in the test task
    cy.get("a.vV3dvPLZ")
      .eq(i)
      .within(() => {
        cy.get("p.BzO81ZRx").should("have.text", dayOfWeekCapitalized);
        cy.get("p.BrJ0wZrO").should("have.text", dayOfMonth);
        cy.get("p.CAXTD7\\+X")
          .should("not.be.empty")
          .and("have.text", currentMonth);
      });
  }
}

describe("test task", () => {
  it("test task", () => {
    cy.visit(urls.mainUrl);
    cy.url().should("include", textContent.urlPart);
    cy.get(mainPageSelectors.searchInputField).as("searchInput").click();
    cy.get(mainPageSelectors.searchBtn).should("not.be.disabled");
    cy.intercept("POST", "**/api/search/suggest").as("suggestRequest");
    cy.get("@searchInput").type(textContent.cityKyiv);
    cy.wait("@suggestRequest").then((interception) => {
      expect(interception.request.body.query).to.eq(textContent.cityKyiv);
      const kyivExists = interception.response.body.locations.some(
        (location) => location.title === textContent.cityKyiv,
      );
      expect(kyivExists).to.be.true;
    });
    cy.intercept(
      "POST",
      `${urls.mainUrl}/api/weather/location/forecast/by_id`,
    ).as("forecastById");
    cy.get("menu")
      .find("a")
      .contains(textContent.cityKyiv)
      .should("have.text", textContent.fullCityKyivName)
      .click();
    cy.wait("@forecastById").then((interception) => {
      cy.wrap(interception.response?.statusCode).should("eq", 200);
    });
    clickingByDays(7);
    cy.intercept("POST", urls.urlForIntercepting).as("choose10days");
    cy.get(mainPageSelectors.tenDaysWeatherLink)
      .contains(textContent.tenDays)
      .should("be.visible")
      .click();
    cy.wait("@choose10days").then((interception) => {
      cy.wrap(interception.response?.statusCode).should("eq", 202);
    });
    clickingByDays(10);
  });
});

/*
2 task
Є таблиця people
колонки id, first_name, last_name, gender, day, month, year вивести всю інформацію про людей в яких first_name починається на J.

    select * from people where first_name like 'J%'

3 task
Вивести стать та кількість людей цієї статті, які народились влітку після 2000 року

    select gender, count(*) as count from people where id in (
        select id
        from people
        where (month in (6, 7, 8)) and year > 2000
    ) 
    group by gender

4 task
Є таблиця cards 
колонки id, people_id, number пов'язана з таблицею people по id людини.
Вивести імена людей в алфавітному порядку (спочатку по прізвищу, потім по імені) 
та їхній номер картки (у однієї людини може бути декілька карток)

    select p.first_name, c.number from cards as c join people as p on c.people_id=p.id order by p.last_name, p.first_name

*/
